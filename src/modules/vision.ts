// src/vision.ts

import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { BoardRectifier } from '@modules/rectify';
import { prominent } from 'color.js';
import { analyzeImageData } from '@modules/colorAnalyzer';
import { showLoadingIndicator } from '@modules/ui';

export class VisionApp {
  private camera: Camera;
  private segmenter: LegoSegmenter;
  private rectifier: BoardRectifier;
  private capturingCanvas: HTMLCanvasElement;

  constructor(
      private video: HTMLVideoElement,
      canvas: HTMLCanvasElement
  ) {
    this.camera = new Camera(video);
    this.segmenter = new LegoSegmenter();
    this.rectifier = new BoardRectifier();
    this.capturingCanvas = canvas;
  }

  /** 预加载分割模型 */
  async init() {
    showLoadingIndicator(true);
    try {
      console.log('🔄 初始化视觉模块');
      await this.segmenter.init();
    } finally {
      showLoadingIndicator(false);
    }
  }

  /** 打开摄像头并准备分割器 */
  async start() {
    try {
      console.log('📷 准备打开摄像头');
      await this.camera.start();
      console.log('📷 摄像头已启动');
      await this.segmenter.init();
    } catch (e) {
      console.error('打开摄像头出错:', e);
    }
  }

  /**
   * 拍照 → 透视矫正 → 分割 → 绘制掩码 overlay → 更新进度 UI →
   * Lego 色分析 → 主色提取 → 返回最匹配 Lego 色
   */
  async analyze(): Promise<string | undefined> {
    showLoadingIndicator(true);
    let legoColor: string | undefined;

    try {
      // —— 1. 拍照 ——
      this.camera.capture(this.capturingCanvas);

      // —— 2. 透视矫正（可选） ——
      let canvasForSeg = this.capturingCanvas;
      try {
        const rectified = await this.rectifier.rectify(this.capturingCanvas);
        if (rectified) canvasForSeg = rectified;
      } catch (e) {
        console.warn('Rectification failed, using original canvas', e);
      }

      // —— 3. 分割 ——
      const result = await this.segmenter.segment(canvasForSeg);
      if (!result?.categoryMask) {
        console.warn('No segmentation mask returned');
        return undefined;
      }
      console.log('Segmentation result:', result);

      // —— 4. 构造 RGBA 掩码并 overlay ——
      const mask = result.categoryMask;
      const raw = new Uint8ClampedArray(mask.getAsUint8Array().buffer);
      const [w, h] = [mask.width, mask.height];
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let i = 0, j = 0; i < raw.length; i++, j += 4) {
        if (raw[i] > 0) {
          rgba[j] = 255;     // R
          rgba[j + 1] = 0;   // G
          rgba[j + 2] = 0;   // B
          rgba[j + 3] = 128; // A
        } else {
          rgba[j + 3] = 0;   // fully transparent
        }
      }
      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = h;
      tmp.getContext('2d')!
          .putImageData(new ImageData(rgba, w, h), 0, 0);

      const overlay = document.getElementById('overlay') as HTMLCanvasElement;
      overlay.width  = this.capturingCanvas.width;
      overlay.height = this.capturingCanvas.height;
      const octx = overlay.getContext('2d')!;
      octx.clearRect(0, 0, overlay.width, overlay.height);
      octx.globalAlpha = 0.4;
      octx.drawImage(tmp, 0, 0, overlay.width, overlay.height);
      octx.globalAlpha = 1;

      // —— 5. 更新进度 / 大小 UI ——
      const stepIndicator = document.getElementById('step-indicator');
      if (stepIndicator) {
        stepIndicator.textContent = 'Segmentation complete';
      }
      const packetInfo = document.getElementById('packet-info');
      if (packetInfo) {
        packetInfo.textContent = `Mask: ${w}×${h} px`;
      }

      // —— 6. Lego 色彩分析 ——
      const segCtx = canvasForSeg.getContext('2d')!;
      const imgData = segCtx.getImageData(0, 0, canvasForSeg.width, canvasForSeg.height);
      legoColor = await analyzeImageData(imgData);
      console.log('Closest Lego color:', legoColor);

      // —— 7. 主色提取 ——
      try {
        // 直接传入 ImageData，避免内部 <img> 加载失败
        const [dominant] = await prominent(imgData, { amount: 1 });
        console.log('Dominant color:', dominant);
      } catch (e) {
        console.warn('主色提取失败（可忽略）', e);
      }
    } catch (e) {
      console.error('analyze 过程中出错:', e);
    } finally {
      showLoadingIndicator(false);
    }

    return legoColor;
  }
}