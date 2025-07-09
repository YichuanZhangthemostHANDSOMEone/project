import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { LegoPipeline, LegoBlockResult } from '@modules/legoPipeline';
import { showLoadingIndicator } from '@modules/ui';

export class VisionApp {
  private camera: Camera;
  private segmenter: LegoSegmenter;
  private pipeline: LegoPipeline;

  constructor(
      private video: HTMLVideoElement,
      private capture: HTMLCanvasElement,
      private overlay: HTMLCanvasElement
  ) {
    this.camera = new Camera(video);
    this.segmenter = new LegoSegmenter();
    this.pipeline = new LegoPipeline(this.segmenter);
  }

  async start() {
    showLoadingIndicator(true);
    await this.segmenter.init();
    await this.camera.start();
    showLoadingIndicator(false);
  }

  async analyze(): Promise<LegoBlockResult[]> {
    this.camera.capture(this.capture);
    const blocks = await this.pipeline.analyze(this.capture);
    this.draw(blocks);
    return blocks;
  }

  private draw(blocks: LegoBlockResult[]) {
    const ctx = this.overlay.getContext('2d')!;
    this.overlay.width = this.capture.width;
    this.overlay.height = this.capture.height;
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    ctx.strokeStyle = '#f00';
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#f00';
    for (const b of blocks) {
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.fillText(b.color, b.x, b.y - 4);
    }
  }
}