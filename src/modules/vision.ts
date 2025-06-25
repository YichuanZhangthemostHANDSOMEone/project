import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { BoardRectifier } from '@modules/rectify';
import { prominent } from 'color.js';

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

  async start() {
    await this.camera.start();
    await this.segmenter.init();
  }

  async analyze() {
    this.camera.capture(this.capturingCanvas);

    const rectified = await this.rectifier.rectify(this.capturingCanvas);

    const ctx = rectified.getContext('2d')!;
    const result = await this.segmenter.segment(rectified);
    if (!result) return;

    const data = ctx.getImageData(0, 0, rectified.width, rectified.height);
    const color = await prominent(data, { amount: 1 });
    console.log('Dominant color:', color);
    console.log('Segmentation result:', result);
  }
}
