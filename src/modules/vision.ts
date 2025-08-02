import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { LegoBoardAnalyzer, CellColorResult } from '@modules/legoBoardAnalyzer';
import { showLoadingIndicator } from '@modules/ui';
import { legoColors } from '@modules/legoColors';

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

  async analyzeAndExport(): Promise<{ image: string; blocks: CellColorResult[] }> {
    const blocks = await this.analyze();
    const out = document.createElement('canvas');
    out.width = this.capture.width;
    out.height = this.capture.height;
    const ctx = out.getContext('2d')!;
    ctx.drawImage(this.capture, 0, 0);
    ctx.drawImage(this.overlay, 0, 0);
    const image = out.toDataURL('image/png');
    console.log('导出的 image 长度：', image.length);
    console.log('识别到的 cells:', blocks);
    sessionStorage.setItem('legoResultBlocks', JSON.stringify(blocks));
    return { image, blocks };
  }

  private draw(cells: CellColorResult[]) {
    const ctx = this.overlay.getContext('2d')!;

    // 1) 使用捕获尺寸同步 canvas
    this.overlay.width = this.capture.width;
    this.overlay.height = this.capture.height;
    // 保证 overlay 的 CSS 尺寸与视频一致
    this.overlay.style.width = `${this.video.clientWidth}px`;
    this.overlay.style.height = `${this.video.clientHeight}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.capture.width, this.capture.height);

    // 2) 绘制单个格子轮廓和颜色标签
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.textBaseline = 'top';
    ctx.strokeStyle = '#ff0000';
    ctx.fillStyle = '#ff0000';
    for (const cell of cells) {
      ctx.beginPath();
      ctx.moveTo(cell.quad[0].x, cell.quad[0].y);
      for (let i = 1; i < 4; i++) {
        ctx.lineTo(cell.quad[i].x, cell.quad[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillText(cell.color, cell.quad[0].x, cell.quad[0].y);
    }

    // 3) 颜色映射
    const colorMap = new Map<string, string>(
        legoColors.map(c => [c.name, `rgb(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]})`])
    );

    // 4) 按 protocol+component + row 分组
    const grouped = new Map<string, Map<number, CellColorResult[]>>();
    for (const cell of cells) {
      const label = `${cell.protocol} · ${cell.component}`;
      let byRow = grouped.get(label);
      if (!byRow) {
        byRow = new Map<number, CellColorResult[]>();
        grouped.set(label, byRow);
      }
      const rowList = byRow.get(cell.row) || [];
      rowList.push(cell);
      byRow.set(cell.row, rowList);
    }

    // 5) 绘制各组凸包
    ctx.lineWidth = 2;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#fff';

    for (const [label, rows] of grouped) {
      // 同一组颜色共用同一描边颜色
      const sampleCells = Array.from(rows.values())[0];
      const sampleCell = sampleCells[0];
      const stroke = colorMap.get(sampleCell.color) || '#f00';
      ctx.strokeStyle = stroke;

      for (const cellsInRow of rows.values()) {
        // 收集角点
        const pts = cellsInRow.reduce((arr, c: CellColorResult) => {
          arr.push(...c.quad);
          return arr;
        }, [] as { x: number; y: number }[]);
        if (pts.length < 3) continue;
        const hull = convexHull(pts);

        // 画多边形
        ctx.beginPath();
        hull.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.stroke();

        // 标签
        const { x, y } = hull[0];
        ctx.fillText(label, x + 4, y + 4);

      }
    }
  }
}

/**
 * Monotone Chain 凸包算法
 */
function convexHull(
    points: { x: number; y: number }[]
): { x: number; y: number }[] {
  const pts = points.slice();
  if (pts.length <= 3) return pts;
  pts.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);

  const cross = (o: any, a: any, b: any) => (a.x - o.x)*(b.y - o.y) - (a.y - o.y)*(b.x - o.x);
  const lower: typeof pts = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: typeof pts = [];
  for (let i = pts.length-1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop(); upper.pop();
  return lower.concat(upper);
}
