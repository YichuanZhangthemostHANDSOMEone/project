// src/vision.ts
import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { BoardRectifier } from '@modules/rectify';
import { showLoadingIndicator } from '@modules/ui';
import { prominent } from 'color.js';

export class VisionApp {
  private camera: Camera;
  private segmenter: LegoSegmenter;
  private rectifier: BoardRectifier;
  private video: HTMLVideoElement;
  private captureCanvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D;

  constructor(
      videoEl: HTMLVideoElement,
      captureCanvas: HTMLCanvasElement,
      overlayCanvas: HTMLCanvasElement
  ) {
    this.video = videoEl;
    this.captureCanvas = captureCanvas;
    this.overlayCanvas = overlayCanvas;
    this.overlayCtx = overlayCanvas.getContext('2d')!;
    this.camera = new Camera(this.video);
    this.segmenter = new LegoSegmenter();
    this.rectifier = new BoardRectifier();
  }

  /** 初始化分割模型并启动摄像头 */
  async start() {
    showLoadingIndicator(true);
    try {
      await this.segmenter.init();
      await this.camera.start();

      // 【关键】同步 canvas 像素缓冲区到视频真实分辨率
      this.captureCanvas.width  = this.video.videoWidth;
      this.captureCanvas.height = this.video.videoHeight;
      this.overlayCanvas.width  = this.video.videoWidth;
      this.overlayCanvas.height = this.video.videoHeight;

      console.log('📷 摄像头已启动，canvas 尺寸：',
          this.captureCanvas.width, '×', this.captureCanvas.height);
    } finally {
      showLoadingIndicator(false);
    }
  }

  /** 获取一帧、分割、提取主色并绘制轮廓 */
  async analyze() {
    try {
      // 每次抓帧前，确保内部尺寸正确（如果视频分辨率变化，可重复设置）
      this.captureCanvas.width  = this.video.videoWidth;
      this.captureCanvas.height = this.video.videoHeight;

      // 1. 拍照到 captureCanvas
      this.camera.capture(this.captureCanvas);
      // 调试：显示原始帧
      document.body.appendChild(this.captureCanvas);

      // 2. 可选透视矫正
      let canvasForSeg = this.captureCanvas;
      try {
        const rectified = await this.rectifier.rectify(this.captureCanvas);
        if (rectified) {
          canvasForSeg = rectified;
          // 同步 rectified canvas 的尺寸（rectifier 返回的 canvas 自带尺寸，一般不需要手动设置）
        }
      } catch (e) {
        console.warn('Rectification failed, using original canvas', e);
      }

      // 3. 运行分割模型
      const result = await this.segmenter.segment(canvasForSeg);
      console.log('Segmentation result:', result);

      // 4. 单通道掩码 → RGBA ImageData
      const mask = result.categoryMask!;
      const raw = mask.getAsUint8Array();
      const width = mask.width;
      const height = mask.height;
      const rgba = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        const v = raw[i];
        const j = i * 4;
        rgba[j]     = 0;
        rgba[j + 1] = 0;
        rgba[j + 2] = 0;
        rgba[j + 3] = v > 0 ? 255 : 0;
      }
      const maskImageData = new ImageData(rgba, width, height);

      // 5. 离屏 Canvas 渲染掩码
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width  = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d')!;
      maskCtx.putImageData(maskImageData, 0, 0);
      // 调试：显示黑白掩码
      document.body.appendChild(maskCanvas);

      // 6. 用掩码裁剪原图
      const clippedCanvas = document.createElement('canvas');
      clippedCanvas.width  = width;
      clippedCanvas.height = height;
      const clipCtx = clippedCanvas.getContext('2d', { willReadFrequently: true })!;

      // 6.1 画原始帧
      clipCtx.drawImage(this.captureCanvas, 0, 0, width, height);
      clipCtx.globalCompositeOperation = 'destination-in';
      clipCtx.drawImage(maskCanvas, 0, 0, width, height);
      clipCtx.globalCompositeOperation = 'source-over';
      // 调试：显示裁剪后只含乐高区域的图
      document.body.appendChild(clippedCanvas);

      // 7. 主色提取
      const dataUrl = clippedCanvas.toDataURL();
      if (dataUrl === 'data:,') {
        throw new Error('生成的 Data URL 无效，可能是空白图像');
      }
      const rawColors = await prominent(dataUrl, { amount: 1 });
      const [r, g, b] = Array.isArray(rawColors[0])
          ? (rawColors[0] as [number, number, number])
          : (rawColors as [number, number, number]);
      console.log('乐高区域主色:', r, g, b);

      // 8. 画轮廓
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      this.overlayCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      this.overlayCtx.lineWidth   = 2;
      for (const path of result.polygonPaths || []) {
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          this.overlayCtx.lineTo(path[i].x, path[i].y);
        }
        this.overlayCtx.closePath();
        this.overlayCtx.stroke();
      }
    } catch (err) {
      console.error('analyze 过程中出错:', err);
    }
  }
}
