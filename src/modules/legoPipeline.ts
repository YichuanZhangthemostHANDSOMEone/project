// src/modules/legoPipeline.ts
// Comprehensive image processing pipeline for LEGO block detection

import cv from '@techstark/opencv-js';
import quantize from 'quantize';
import Color from 'colorjs.io';
import deltaE from 'colorjs.io/src/deltaE.js';

import { LegoSegmenter } from '@modules/segmentation';
import { LEGO_COLORS } from '@modules/colorAnalyzer';

export interface LegoBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

/** Helper to convert an RGB color (0-255 range) to LAB using Color.js */
function rgbToLab(rgb: [number, number, number]): [number, number, number] {
  const c = new Color('srgb', rgb.map(v => v / 255));
  const l = c.to('lab');
  return [l.coords[0], l.coords[1], l.coords[2]];
}

/** Convert Lab color back to RGB in 0-255 range */
function labToRgb(lab: [number, number, number]): [number, number, number] {
  const c = new Color('lab', lab).to('srgb');
  return [
    Math.round(c.coords[0] * 255),
    Math.round(c.coords[1] * 255),
    Math.round(c.coords[2] * 255),
  ];
}

/**
 * Pipeline orchestrator class. It expects an already initialised LegoSegmenter
 * instance. The `process` method receives a canvas with the captured frame and
 * returns detected blocks with their color labels.
 */
export class LegoPipeline {
  constructor(private segmenter: LegoSegmenter) {}

  async process(frame: HTMLCanvasElement): Promise<LegoBlock[]> {
    const srcRgba = cv.imread(frame);
    const src = new cv.Mat();
    // Ensure 3-channel RGB image
    cv.cvtColor(srcRgba, src, cv.COLOR_RGBA2RGB);

    // --- Step 2: run segmentation model ---
    const seg = await this.segmenter.segment(frame);
    if (!seg || !seg.categoryMask) {
      srcRgba.delete();
      src.delete();
      return [];
    }

    const maskData = seg.categoryMask.getAsUint8Array();
    const mask = new cv.Mat(seg.categoryMask.height, seg.categoryMask.width, cv.CV_8UC1);
    for (let i = 0; i < maskData.length; i++) {
      mask.data[i] = maskData[i] > 0 ? 255 : 0;
    }

    // --- Optional Gaussian blur on the captured image ---
    const blurred = new cv.Mat();
    cv.GaussianBlur(src, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    // --- Dominant color extraction only on LEGO regions ---
    const pixels: [number, number, number][] = [];
    for (let y = 0; y < mask.rows; y++) {
      for (let x = 0; x < mask.cols; x++) {
        const idx = y * mask.cols + x;
        if (mask.data[idx] === 255) {
          const j = idx * 3;
          pixels.push([
            blurred.data[j],
            blurred.data[j + 1],
            blurred.data[j + 2],
          ]);
        }
      }
    }

    if (!pixels.length) {
      srcRgba.delete();
      src.delete();
      mask.delete();
      blurred.delete();
      return [];
    }

    const cmap = quantize(pixels, Math.min(8, pixels.length));
    let palette = cmap.palette() as [number, number, number][];

    // Count pixels per cluster
    const counts = new Array(palette.length).fill(0);
    for (const p of pixels) {
      const mapped = cmap.map(p) as [number, number, number];
      const idx = palette.findIndex(c =>
        c[0] === mapped[0] && c[1] === mapped[1] && c[2] === mapped[2]);
      if (idx >= 0) counts[idx]++;
    }
    // Remove the largest cluster (assumed background)
    const maxIdx = counts.indexOf(Math.max(...counts));
    palette = palette.filter((_, i) => i !== maxIdx);

    // --- Convert image to Lab ---
    const labImg = new cv.Mat();
    cv.cvtColor(src, labImg, cv.COLOR_RGB2Lab);

    const detected: LegoBlock[] = [];

    for (const palColor of palette) {
      // Convert palette color to Lab
      const palLab = rgbToLab(palColor);
      // Create threshold mask in Lab space
      const lower = new cv.Mat(labImg.rows, labImg.cols, labImg.type(), [
        palLab[0] - 10,
        palLab[1] - 15,
        palLab[2] - 15,
        0,
      ]);
      const upper = new cv.Mat(labImg.rows, labImg.cols, labImg.type(), [
        palLab[0] + 10,
        palLab[1] + 15,
        palLab[2] + 15,
        255,
      ]);

      const colorMask = new cv.Mat();
      cv.inRange(labImg, lower, upper, colorMask);
      lower.delete();
      upper.delete();

      // Morphological cleaning
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.morphologyEx(colorMask, colorMask, cv.MORPH_OPEN, kernel);
      cv.morphologyEx(colorMask, colorMask, cv.MORPH_CLOSE, kernel);

      // Contour detection
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(colorMask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        if (area < 100) {
          cnt.delete();
          continue;
        }

        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
        if (approx.rows !== 4 || !cv.isContourConvex(approx)) {
          approx.delete();
          cnt.delete();
          continue;
        }

        const rect = cv.boundingRect(approx);
        const aspect = rect.width / rect.height;
        if (aspect < 0.5 || aspect > 2) {
          approx.delete();
          cnt.delete();
          continue;
        }

        // Mean Lab color inside the region
        const roiLab = labImg.roi(rect);
        const roiMask = colorMask.roi(rect);
        const meanScalar = cv.mean(roiLab, roiMask);
        roiLab.delete();
        roiMask.delete();

        const meanLab: [number, number, number] = [
          meanScalar[0],
          meanScalar[1],
          meanScalar[2],
        ];
        const meanRgb = labToRgb(meanLab);

        // Determine closest LEGO color
        let bestColor = LEGO_COLORS[0].name;
        let bestDelta = Infinity;
        for (const lego of LEGO_COLORS) {
          const legoLab = rgbToLab(lego.rgb);
          const d = deltaE(new Color('lab', meanLab), new Color('lab', legoLab), {
            method: '2000',
          });
          if (d < bestDelta) {
            bestDelta = d;
            bestColor = lego.name;
          }
        }

        detected.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          color: bestColor,
        });

        approx.delete();
        cnt.delete();
      }
      contours.delete();
      hierarchy.delete();
      colorMask.delete();
      kernel.delete();
    }

    // Cleanup
    labImg.delete();
    blurred.delete();
    mask.delete();
    src.delete();
    srcRgba.delete();

    return detected;
  }
}

