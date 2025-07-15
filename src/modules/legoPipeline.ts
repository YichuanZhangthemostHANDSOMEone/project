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
    // 1. 提取原始 RGB
    const rgbMat = this.canvasToRGBMat(canvas);

    // 2. 调用segmenter 获取 Prediction[]
    console.log('🔍 [Pipeline] Calling segmenter...');
    const preds = await this.segmenter.segment(canvas);
    console.log('🔍 [Pipeline] segmenter.predictions =', preds);
    if (!preds || preds.length === 0) {
      console.warn('⚠️ [Pipeline] No predictions returned');
      rgbMat.delete();
      return [];
    }

    // 3. 使用第一个预测的 mask（Base64 PNG），转换为单通道 Mat
    const base64 = preds[0].mask.split(',')[1];
    const u8 = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const mask = cv.imdecode(u8); // CV_8UC1, 0 背景 / 255 前景

    // 4. 对 RGB 图像做高斯模糊
    const blurred = new cv.Mat();
    cv.GaussianBlur(rgbMat, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    // 5. 从模糊图像和 mask 中提取颜色调色板
    const palette = this.extractPalette(blurred, mask);
    if (!palette.length) {
      rgbMat.delete(); blurred.delete(); mask.delete();
      return [];
    }

    // 6. 转换到 Lab 空间
    const labMat = new cv.Mat();
    cv.cvtColor(blurred, labMat, cv.COLOR_RGB2Lab);

    // 7. 对每种调色板颜色做阈值分割、清理、轮廓检测、均值色匹配
    const results: LegoBlockResult[] = [];
    for (const pc of palette) {
      const thresh = this.thresholdLab(labMat, pc.lab);
      const clean  = this.cleanMask(thresh);
      const rects  = this.findRectangles(clean);

      for (const rect of rects) {
        const mean  = this.meanColor(labMat, rect);
        const label = this.matchColor(mean);
        results.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          color: label,
        });
      }

      thresh.delete(); clean.delete();
    }

    // 8. 释放中间 Mat
    rgbMat.delete(); blurred.delete(); mask.delete(); labMat.delete();

    return results;
  }

  private canvasToRGBMat(canvas: HTMLCanvasElement): any {
    const src = cv.imread(canvas);
    const dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);
    src.delete();
    return dst;
  }

  private extractPalette(image: any, mask: any): PaletteColor[] {
    const pixels: number[][] = [];
    for (let y = 0; y < image.rows; y++) {
      for (let x = 0; x < image.cols; x++) {
        if (mask.ucharPtr(y, x)[0] > 0) {
          const p = image.ucharPtr(y, x);
          pixels.push([p[0], p[1], p[2]]);
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
    arr.shift(); // 去掉最主导的背景色聚类
    return arr;
  }

  private rgbToLab(rgb: [number, number, number]): [number, number, number] {
    const tmp = cv.matFromArray(1, 1, cv.CV_8UC3, rgb);
    const lab = new cv.Mat();
    cv.cvtColor(tmp, lab, cv.COLOR_RGB2Lab);
    const v = lab.ucharPtr(0, 0);
    const out: [number, number, number] = [v[0], v[1], v[2]];
    tmp.delete(); lab.delete();
    return out;
  }

  private thresholdLab(labMat: any, lab: [number, number, number]): any {
    // 三通道阈值，无需 alpha
    const lower = new cv.Mat(labMat.rows, labMat.cols, labMat.type(), [
      Math.max(0, lab[0] - 10),
      Math.max(0, lab[1] - 15),
      Math.max(0, lab[2] - 15)
    ]);
    const upper = new cv.Mat(labMat.rows, labMat.cols, labMat.type(), [
      Math.min(255, lab[0] + 10),
      Math.min(255, lab[1] + 15),
      Math.min(255, lab[2] + 15)
    ]);
    const mask = new cv.Mat();
    cv.inRange(labMat, lower, upper, mask);
    lower.delete(); upper.delete();
    return mask;
  }

  private cleanMask(mask: any): any {
    const k = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const out = new cv.Mat();
    cv.morphologyEx(mask, out, cv.MORPH_OPEN, k);
    cv.morphologyEx(out, out, cv.MORPH_CLOSE, k);
    k.delete();
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
      cnt.delete();
      if (area < 100) continue;
      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const r = cv.boundingRect(approx);
        const aspect = r.width / r.height;
        if (aspect > 0.5 && aspect < 2.0) rects.push(r);
      }
      approx.delete();
    }
    hierarchy.delete(); contours.delete();
    return rects;
  }

  private meanColor(labMat: any, rect: any): [number, number, number] {
    const roi = labMat.roi(rect);
    const m = cv.mean(roi);
    roi.delete();
    return [m[0], m[1], m[2]];
  }

  private matchColor(lab: [number, number, number]): string {
    let best: LegoColor | null = null;
    let minE = Infinity;
    const sample = new Color('lab', lab);
    for (const c of legoColors) {
      const rgbNorm: [number, number, number] = [c.rgb[0]/255, c.rgb[1]/255, c.rgb[2]/255];
      const legoC = new Color('srgb', rgbNorm);
      const d = sample.deltaE(legoC, { method: '2000' });
      if (d < minE) { minE = d; best = c; }
    }
    return best ? best.name : 'Unknown';
  }
}
