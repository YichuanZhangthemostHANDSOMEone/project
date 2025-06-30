// src/vision.ts
import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { BoardRectifier } from '@modules/rectify';
import { showLoadingIndicator, showMessage } from '@modules/ui';
import { prominent } from 'color.js';
import { analyzeImageData } from '@modules/colorAnalyzer';

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

      // 2. 运行分割模型（先在原始画面上分割）
      const result = await this.segmenter.segment(this.captureCanvas);
      if (!result) {
        showMessage('无法检测到前景，请将乐高底板放入画面中心');
        return;
      }
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

      // 6. 对原图和掩码一并进行透视矫正
      let rectifiedCanvas = this.captureCanvas;
      let rectifiedMask   = maskCanvas;
      try {
        const rectified = await this.rectifier.rectifyWithMask(this.captureCanvas, maskCanvas);
        rectifiedCanvas = rectified.canvas;
        rectifiedMask   = rectified.mask;
      } catch (e) {
        console.warn('Rectification failed, continue with original', e);
      }

      // 7. 用掩码裁剪矫正后的图像
      const clippedCanvas = document.createElement('canvas');
      clippedCanvas.width  = rectifiedCanvas.width;
      clippedCanvas.height = rectifiedCanvas.height;
      const clipCtx = clippedCanvas.getContext('2d', { willReadFrequently: true })!;

      // 7.1 画矫正后的帧
      clipCtx.drawImage(rectifiedCanvas, 0, 0);
      clipCtx.globalCompositeOperation = 'destination-in';
      clipCtx.drawImage(rectifiedMask, 0, 0);
      clipCtx.globalCompositeOperation = 'source-over';
      // 调试：显示裁剪后只含乐高区域的图
      document.body.appendChild(clippedCanvas);
      const dataUrl = clippedCanvas.toDataURL();
      if (dataUrl === 'data:,') {
        showMessage('裁剪后的 Canvas 内容为空，无法提取颜色');
        return;
      }
      const rawColors = await prominent(dataUrl, { amount: 1 });
      const [r, g, b] = Array.isArray(rawColors[0])
          ? (rawColors[0] as [number, number, number])
          : (rawColors as [number, number, number]);
      console.log('乐高区域主色:', r, g, b);

      // 7.2 按连通域识别每块乐高颜色
      const maskData = rectifiedMask.getContext('2d', { willReadFrequently: true })!
        .getImageData(0, 0, rectifiedMask.width, rectifiedMask.height);
      const visited = new Int32Array(rectifiedMask.width * rectifiedMask.height).fill(-1);
      const compColors: { color: string; x: number; y: number }[] = [];
      let labelId = 0;
      const directions = [1, -1, rectifiedMask.width, -rectifiedMask.width];
      for (let i = 0; i < visited.length; i++) {
        if (visited[i] !== -1) continue;
        if (maskData.data[i * 4 + 3] === 0) continue;

        let minX = rectifiedMask.width, minY = rectifiedMask.height;
        let maxX = 0, maxY = 0;
        const stack = [i];
        visited[i] = labelId;
        while (stack.length) {
          const idx = stack.pop()!;
          const x = idx % rectifiedMask.width;
          const y = Math.floor(idx / rectifiedMask.width);
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;

          for (const d of directions) {
            const ni = idx + d;
            if (ni < 0 || ni >= visited.length) continue;
            if (Math.abs(d) === 1 && Math.floor(ni / rectifiedMask.width) !== y) continue;
            if (visited[ni] === -1 && maskData.data[ni * 4 + 3] !== 0) {
              visited[ni] = labelId;
              stack.push(ni);
            }
          }
        }

        const region = clipCtx.getImageData(minX, minY, maxX - minX + 1, maxY - minY + 1);
        const colorName = await analyzeImageData(region);
        compColors.push({ color: colorName, x: minX, y: minY });
        labelId++;
      }

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

      // 显示每块乐高的颜色名称
      this.overlayCtx.fillStyle = '#ffffff';
      for (const comp of compColors) {
        this.overlayCtx.fillText(comp.color, comp.x, comp.y - 2);
      }
    } catch (err) {
      console.error('analyze 过程中出错:', err);
    }
  }
}
