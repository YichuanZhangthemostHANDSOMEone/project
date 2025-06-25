import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { prominent } from 'color.js';
import { analyzeImageData } from '@modules/colorAnalyzer';

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
    await this.camera.start();
    await this.segmenter.init();
  }

  async analyze(): Promise<string | undefined> {
    const ctx = this.camera.capture(this.capturingCanvas);
    const result = await this.segmenter.segment(this.capturingCanvas);
    if (!result) return;

    const data = ctx.getImageData(0, 0, this.capturingCanvas.width, this.capturingCanvas.height);
    const legoColor = await analyzeImageData(data);
    const color = await prominent(data, { amount: 1 });
    console.log('Dominant color:', color);
    console.log('Closest Lego color:', legoColor);
    console.log('Segmentation result:', result);
    return legoColor;
  }
}
