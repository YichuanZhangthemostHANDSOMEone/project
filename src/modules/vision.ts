import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { LegoBoardAnalyzer, CellColorResult } from '@modules/legoBoardAnalyzer';
import { showLoadingIndicator } from '@modules/ui';
import {deltaE} from "colorjs.io/fn";

export class VisionApp {
  private camera: Camera;
  private segmenter: LegoSegmenter;
  private analyzer: LegoBoardAnalyzer;

  constructor(
      private video: HTMLVideoElement,
      private capture: HTMLCanvasElement,
      private overlay: HTMLCanvasElement
  ) {
    this.camera = new Camera(video);
    this.segmenter = new LegoSegmenter();
    this.analyzer = new LegoBoardAnalyzer(this.segmenter);
  }

  async start() {
    showLoadingIndicator(true);
    await this.camera.start();
    showLoadingIndicator(false);
  }

  async analyze(): Promise<CellColorResult[]> {
    this.camera.capture(this.capture);
    const cells = await this.analyzer.analyze(this.capture);
    this.draw(cells);
    return cells;
  }

  async analyzeAndExport(): Promise<{ image:string; blocks: CellColorResult[] }> {
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

    // Analyzer works on the capture directly, so no additional cropping
    // is required. We simply export the annotated image with overlays.

    // **在这里打印**，方便调试看是不是拿到了数据
    console.log('导出的 image 长度：', image.length);
    console.log('识别到的 cells:', blocks);
    sessionStorage.setItem('legoResultBlocks', JSON.stringify(blocks));

    // 3) 返回给调用方
    return { image, blocks };
  }

  private draw(cells: CellColorResult[]) {
    const ctx = this.overlay.getContext('2d')!;
    this.overlay.width = this.capture.width;
    this.overlay.height = this.capture.height;
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    ctx.strokeStyle = '#f00';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#f00';
    cells.forEach(cell => {
      ctx.beginPath();
      ctx.moveTo(cell.quad[0].x, cell.quad[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(cell.quad[i].x, cell.quad[i].y);
      ctx.closePath();
      ctx.stroke();
      ctx.fillText(cell.color, cell.quad[0].x, cell.quad[0].y);
    });
  }
}