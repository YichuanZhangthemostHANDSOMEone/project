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
    const mask = new cv.Mat.zeros(rgbMat.rows, rgbMat.cols, cv.CV_8UC1);

    // 1. Flatten the array of points into a number[] [x0, y0, x1, y1, …]
    const rawCoords: number[] = [];
    for (const p of preds[0].points) {
      rawCoords.push(p.x, p.y);
    }
//

// 2. 用 matFromArray 生成一个 size=N×1，每个元素是 (x,y) 的 Mat
    const contourMat = cv.matFromArray(
        preds[0].points.length,    // rows
        1,                          // cols
        cv.CV_32SC2,                // 每个元素两个 32 位整型
        rawCoords                   // 扁平化后的坐标数组
    );

// 3. 新建一个 MatVector，把 contourMat push 进去
    const contours = new cv.MatVector();
    contours.push_back(contourMat);

// 4. 真正调用 fillPoly
    cv.fillPoly(mask, contours, new cv.Scalar(255));

// 5. 释放内存
    contourMat.delete();
    contours.delete();

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

  private thresholdLab(labMat: cv.Mat, lab: [number, number, number]): cv.Mat {
    const [L, A, B] = lab;

    // 使用 Mat 表示阈值，以避免 Emscripten 绑定将 Scalar 当成 Mat 处理
    const lower = new cv.Mat(
        labMat.rows,
        labMat.cols,
        labMat.type(),
        new cv.Scalar(
            Math.max(0, L - 10),
            Math.max(0, A - 15),
            Math.max(0, B - 15),
            0
        )
    );
    const upper = new cv.Mat(
        labMat.rows,
        labMat.cols,
        labMat.type(),
        new cv.Scalar(
            Math.min(255, L + 10),
            Math.min(255, A + 15),
            Math.min(255, B + 15),
            255
        )
    );

    const mask = new cv.Mat();
    cv.inRange(labMat, lower, upper, mask);

    lower.delete();
    upper.delete();

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
      if (area < 100) {
        cnt.delete();
        continue;
      }
      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const r = cv.boundingRect(approx);
        const aspect = r.width / r.height;
        if (aspect > 0.5 && aspect < 2.0) rects.push(r);
      }
      approx.delete();
      cnt.delete();
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
    // OpenCV returns Lab values scaled to 0-255. Convert to the
    // ranges expected by colorjs.io: L in 0-100 and a/b in -128..127.
    const labScaled: [number, number, number] = [
        lab[0] * 100 / 255,
        lab[1] - 128,
        lab[2] - 128,
    ];

    let best: LegoColor | null = null;
    let minE = Infinity;
    const sample = new Color('lab', labScaled);
    for (const c of legoColors) {
      const rgbNorm: [number, number, number] = [
          c.rgb[0] / 255,
          c.rgb[1] / 255,
          c.rgb[2] / 255,
      ];
      const legoC = new Color('srgb', rgbNorm);
      const d = sample.deltaE(legoC, { method: '2000' });
      if (d < minE) {
        minE = d;
        best = c;
      }
    }
    return best ? best.name : 'Unknown';
  }
}
