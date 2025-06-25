import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { BoardRectifier } from '@modules/rectify';
import { prominent } from 'color.js';
import { showLoadingIndicator } from '@modules/ui';

export class VisionApp {
  private camera: Camera;
  private segmenter: LegoSegmenter;
  private rectifier: BoardRectifier;
  private capturingCanvas: HTMLCanvasElement;

  constructor(private video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.camera = new Camera(video);
    this.segmenter = new LegoSegmenter();
    this.rectifier = new BoardRectifier();
    this.capturingCanvas = canvas;
  }

  async init() {
    showLoadingIndicator(true);
    try {
      console.log('🔄 初始化视觉模块');
      await this.segmenter.init();
    } finally {
      showLoadingIndicator(false);
    }
  }

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

  async analyze() {
    // 1. 拍照
    this.camera.capture(this.capturingCanvas);

    // 2. 可选透视矫正
    let canvasForSeg = this.capturingCanvas;
    try {
      const rectified = await this.rectifier.rectify(this.capturingCanvas);
      if (rectified) canvasForSeg = rectified;
    } catch (e) {
      console.warn('Rectification failed, using original canvas', e);
    }

    // 3. 分割
    const result = await this.segmenter.segment(canvasForSeg);
    if (!result?.categoryMask) {
      console.warn('No segmentation mask returned');
      return;
    }
    console.log('Segmentation result:', result);

    // 4. 构造 RGBA 掩码并绘制
    const mask     = result.categoryMask;
    const rawBuf   = mask.getAsUint8Array().buffer;
    const raw      = new Uint8ClampedArray(rawBuf);
    const [w, h]   = [mask.width, mask.height];
    const rgba     = new Uint8ClampedArray(w * h * 4);
    for (let i = 0, j = 0; i < raw.length; i++, j += 4) {
      if (raw[i] > 0) {
        rgba[j] = 255; rgba[j+1] = 0; rgba[j+2] = 0; rgba[j+3] = 128;
      } else {
        rgba[j+3] = 0;
      }
    }
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d')!.putImageData(new ImageData(rgba, w, h), 0, 0);

    const overlay = document.getElementById('overlay') as HTMLCanvasElement;
    overlay.width  = this.capturingCanvas.width;
    overlay.height = this.capturingCanvas.height;
    const octx = overlay.getContext('2d')!;
    octx.clearRect(0, 0, overlay.width, overlay.height);
    octx.globalAlpha = 0.4;
    octx.drawImage(tmp, 0, 0, overlay.width, overlay.height);
    octx.globalAlpha = 1;

    // 5. 更新 UI 文本
    const stepEl = document.getElementById('step-indicator');
    if (stepEl) {
      stepEl.textContent = 'Segmentation complete';
    }
    const infoEl = document.getElementById('packet-info');
    if (infoEl) {
      infoEl.textContent = `Mask: ${w}×${h} px`;
    }

    // 6. （可选）主色提取
    try {
      const dataUrl = canvasForSeg.toDataURL();
      const color = await prominent(dataUrl, { amount: 1 });
      console.log('Dominant color:', color);
    } catch (e) {
      console.error('Color extraction failed:', e);
    }
  }  // ← 这是 analyze() 的闭合

}    // ← 这是 class VisionApp 的闭合