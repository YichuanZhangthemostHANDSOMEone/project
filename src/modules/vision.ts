import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { prominent } from 'color.js';

export class VisionApp {
  private camera: Camera;
  private segmenter: LegoSegmenter;
  private capturingCanvas: HTMLCanvasElement;

  constructor(private video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.camera = new Camera(video);
    this.segmenter = new LegoSegmenter();
    this.capturingCanvas = canvas;
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
    const ctx = this.camera.capture(this.capturingCanvas);
    const result = await this.segmenter.segment(this.capturingCanvas);
    if (!result) return;

    const data = ctx.getImageData(0, 0, this.capturingCanvas.width, this.capturingCanvas.height);
    const color = await prominent(data, { amount: 1 });
    console.log('Dominant color:', color);
    console.log('Segmentation result:', result);
  }
}
