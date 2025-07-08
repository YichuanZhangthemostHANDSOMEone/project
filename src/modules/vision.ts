import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { LegoPipeline } from '@modules/legoPipeline';
import { showLoadingIndicator, showMessage } from '@modules/ui';

export class VisionApp {
  private camera: Camera;
  private segmenter: LegoSegmenter;
  private pipeline: LegoPipeline;
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
    this.pipeline = new LegoPipeline(this.segmenter);
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

  /** 拍照并用 LegoPipeline 识别乐高积木 */
  async analyze() {
    try {
      // 每次抓帧前同步尺寸
      this.captureCanvas.width  = this.video.videoWidth;
      this.captureCanvas.height = this.video.videoHeight;

      // 拍照到 captureCanvas
      this.camera.capture(this.captureCanvas);

      const blocks = await this.pipeline.process(this.captureCanvas);

      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

      if (blocks.length === 0) {
        showMessage('No LEGO blocks detected');
        return;
      }

      this.overlayCtx.strokeStyle = '#00ff00';
      this.overlayCtx.lineWidth = 2;
      this.overlayCtx.fillStyle = '#ffffff';
      for (const b of blocks) {
        this.overlayCtx.strokeRect(b.x, b.y, b.width, b.height);
        this.overlayCtx.fillText(b.color, b.x, b.y - 2);
      }
    } catch (err) {
      console.error('analyze 过程中出错:', err);
    }
  }
}
