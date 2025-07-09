// src/modules/legoPipeline.ts
import cv from '@techstark/opencv-js';
import quantize from 'quantize';
import Color from 'colorjs.io';
import { LegoSegmenter } from '@modules/segmentation';
import { legoColors, LegoColor } from '@modules/legoColors';

export interface LegoBlockResult {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface PaletteColor {
  rgb: [number, number, number];
  lab: [number, number, number];
  count: number;
}

export class LegoPipeline {
  constructor(private segmenter: LegoSegmenter) {}

  async analyze(canvas: HTMLCanvasElement): Promise<LegoBlockResult[]> {
    const rgbMat = this.canvasToRGBMat(canvas);
    const seg = await this.segmenter.segment(canvas);
    if (!seg || !seg.categoryMask) return [];

    const mask = this.maskToMat(seg.categoryMask, canvas.width, canvas.height);

    const blurred = new cv.Mat();
    cv.GaussianBlur(rgbMat, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    const palette = this.extractPalette(blurred, mask);
    if (!palette.length) {
      rgbMat.delete();
      blurred.delete();
      mask.delete();
      return [];
    }

    const labMat = new cv.Mat();
    cv.cvtColor(blurred, labMat, cv.COLOR_RGB2Lab);

    const blocks: LegoBlockResult[] = [];
    for (const color of palette) {
      const thresh = this.thresholdLab(labMat, color.lab);
      const clean = this.cleanMask(thresh);
      const rects = this.findRectangles(clean);
      for (const rect of rects) {
        const mean = this.meanColor(labMat, rect);
        const label = this.matchColor(mean);
        blocks.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          color: label,
        });
      }
      thresh.delete();
      clean.delete();
    }

    rgbMat.delete();
    blurred.delete();
    mask.delete();
    labMat.delete();

    return blocks;
  }

  private canvasToRGBMat(canvas: HTMLCanvasElement): any {
    const src = cv.imread(canvas);
    const dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);
    src.delete();
    return dst;
  }

  private maskToMat(mask: any, width: number, height: number): any {
    const data = mask.getAsUint8Array();
    const mat = cv.matFromArray(height, width, cv.CV_8UC1, data);
    return mat;
  }

  private extractPalette(image: any, mask: any): PaletteColor[] {
    const pixels: number[][] = [];
    for (let y = 0; y < image.rows; y++) {
      for (let x = 0; x < image.cols; x++) {
        if (mask.ucharPtr(y, x)[0] > 0) {
          const pix = image.ucharPtr(y, x);
          pixels.push([pix[0], pix[1], pix[2]]); // RGB order
        }
      }
    }

    if (!pixels.length) return [];

    const cmap: any = quantize(pixels, Math.min(8, pixels.length));
    const counts = new Map<string, PaletteColor>();
    for (const p of pixels) {
      const q = cmap.map(p);
      const key = q.join(',');
      const entry = counts.get(key) || {
        rgb: [q[0], q[1], q[2]] as [number, number, number],
        lab: this.rgbToLab(q as [number, number, number]),
        count: 0,
      };
      entry.count++;
      counts.set(key, entry);
    }

    const arr = Array.from(counts.values());
    arr.sort((a, b) => b.count - a.count);
    arr.shift(); // remove dominant background cluster
    return arr;
  }

  private rgbToLab(rgb: [number, number, number]): [number, number, number] {
    const tmp = cv.matFromArray(1, 1, cv.CV_8UC3, rgb);
    const lab = new cv.Mat();
    cv.cvtColor(tmp, lab, cv.COLOR_RGB2Lab);
    const val = lab.ucharPtr(0, 0);
    const ret: [number, number, number] = [val[0], val[1], val[2]];
    tmp.delete();
    lab.delete();
    return ret;
  }

  private thresholdLab(labMat: any, lab: [number, number, number]): any {
    const lower = new cv.Mat(labMat.rows, labMat.cols, labMat.type(), [
      Math.max(0, lab[0] - 10),
      Math.max(0, lab[1] - 15),
      Math.max(0, lab[2] - 15),
      0,
    ]);
    const upper = new cv.Mat(labMat.rows, labMat.cols, labMat.type(), [
      Math.min(255, lab[0] + 10),
      Math.min(255, lab[1] + 15),
      Math.min(255, lab[2] + 15),
      255,
    ]);
    const mask = new cv.Mat();
    cv.inRange(labMat, lower, upper, mask);
    lower.delete();
    upper.delete();
    return mask;
  }

  private cleanMask(mask: any): any {
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const out = new cv.Mat();
    cv.morphologyEx(mask, out, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(out, out, cv.MORPH_CLOSE, kernel);
    kernel.delete();
    return out;
  }

  private findRectangles(mask: any): any[] {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    const rects: any[] = [];
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
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const rect = cv.boundingRect(approx);
        const aspect = rect.width / rect.height;
        if (aspect > 0.5 && aspect < 2.0) {
          rects.push(rect);
        }
      }
      approx.delete();
      cnt.delete();
    }
    hierarchy.delete();
    contours.delete();
    return rects;
  }

  private meanColor(labMat: any, rect: any): [number, number, number] {
    const roi = labMat.roi(rect);
    const mean = cv.mean(roi);
    roi.delete();
    return [mean[0], mean[1], mean[2]];
  }

  private matchColor(lab: [number, number, number]): string {
    let best: LegoColor | null = null;
    let minDiff = Infinity;
    const sample = new Color('lab', lab);
    for (const c of legoColors) {

      const normalizedRgb = [
        c.rgb[0] / 255,
        c.rgb[1] / 255,
        c.rgb[2] / 255,
      ] as [number, number, number];

      const legoCol = new Color('srgb', normalizedRgb);  // 用 'srgb' 而不是 'rgb'
      const diff = sample.deltaE(legoCol, { method: '2000' });

      if (diff < minDiff) {
        minDiff = diff;
        best = c;
      }
    }
    return best ? best.name : 'Unknown';
  }
}
