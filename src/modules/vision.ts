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
    await this.camera.start();
    showLoadingIndicator(false);
  }

  async analyze(): Promise<LegoBlockResult[]> {
    this.camera.capture(this.capture);
    const blocks = await this.pipeline.analyze(this.capture);
    this.draw(blocks);
    return blocks;
  }

  async analyzeAndExport(): Promise<{ image:string; blocks:LegoBlockResult[] }> {
    // 1) 调用 analyze 拿到识别结果
    const blocks = await this.analyze();

    // 2) 生成合成画布并导出 Base64
    const out = document.createElement('canvas');
    out.width  = this.capture.width;
    out.height = this.capture.height;
    const ctx = out.getContext('2d')!;
    ctx.drawImage(this.capture, 0, 0);
    ctx.drawImage(this.overlay, 0, 0);
    const image = out.toDataURL('image/png');

    // 裁剪每个识别块生成 Base64
    const blockImages: string[] = [];
    for (const b of blocks) {
      const c = document.createElement('canvas');
      c.width = b.width;
      c.height = b.height;
      const bctx = c.getContext('2d')!;
      bctx.drawImage(this.capture, b.x, b.y, b.width, b.height, 0, 0, b.width, b.height);
      blockImages.push(c.toDataURL('image/png'));
    }

    // **在这里打印**，方便调试看是不是拿到了数据
    console.log('导出的 image 长度：', image.length);
    console.log('识别到的 blocks:', blocks);
    console.log('裁剪得到的 blockImages 数量：', blockImages.length);

    sessionStorage.setItem('legoResultBlocks', JSON.stringify(blocks));
    sessionStorage.setItem('legoResultBlockImages', JSON.stringify(blockImages));

    // 3) 返回给调用方
    return { image, blocks };
  }

  private draw(blocks: LegoBlockResult[]) {
    const ctx = this.overlay.getContext('2d')!;
    this.overlay.width = this.capture.width;
    this.overlay.height = this.capture.height;
    ctx.clearRect(0,0,this.overlay.width,this.overlay.height);
    ctx.strokeStyle='#f00'; ctx.font='16px sans-serif'; ctx.fillStyle='#f00';
    for (const b of blocks) {
      ctx.strokeRect(b.x,b.y,b.width,b.height);
      ctx.fillText(b.color,b.x,b.y-4);
    }
  }
}