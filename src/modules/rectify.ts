import cv from '@techstark/opencv-js';

export class BoardRectifier {
  private initialized: Promise<void>;

  constructor() {
    this.initialized = new Promise(resolve => {
      if ((cv as any)['onRuntimeInitialized']) {
        (cv as any)['onRuntimeInitialized'] = () => resolve();
      } else {
        // already loaded
        resolve();
      }
    });
  }

  async rectify(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
    await this.initialized;
    const src = cv.imread(canvas);

    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    const edged = new cv.Mat();
    cv.Canny(blurred, edged, 50, 150);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edged, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let board: any = null;
    let maxArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
      if (approx.rows === 4) {
        const area = cv.contourArea(approx);
        if (area > maxArea) {
          maxArea = area;
          if (board) board.delete();
          board = approx;
        } else {
          approx.delete();
        }
      } else {
        approx.delete();
      }
      cnt.delete();
    }
    hierarchy.delete();
    edged.delete();
    blurred.delete();
    gray.delete();

    if (!board) {
      src.delete();
      contours.delete();
      // no board detected, return original canvas
      return canvas;
    }

    const data = board.data32S;
    const pts = [] as { x: number; y: number }[];
    for (let i = 0; i < 4; i++) {
      pts.push({ x: data[i * 2], y: data[i * 2 + 1] });
    }
    // order points: top-left, top-right, bottom-right, bottom-left
    pts.sort((a, b) => a.y - b.y);
    const [top1, top2, bottom1, bottom2] = pts;
    const tl = top1.x < top2.x ? top1 : top2;
    const tr = top1.x < top2.x ? top2 : top1;
    const bl = bottom1.x < bottom2.x ? bottom1 : bottom2;
    const br = bottom1.x < bottom2.x ? bottom2 : bottom1;

    const widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
    const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
    const dstWidth = Math.max(widthA, widthB);

    const heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
    const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
    const dstHeight = Math.max(heightA, heightB);

    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl.x, tl.y,
      tr.x, tr.y,
      br.x, br.y,
      bl.x, bl.y,
    ]);
    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      dstWidth - 1, 0,
      dstWidth - 1, dstHeight - 1,
      0, dstHeight - 1,
    ]);
    const M = cv.getPerspectiveTransform(srcTri, dstTri);
    const dst = new cv.Mat();
    cv.warpPerspective(src, dst, M, new cv.Size(dstWidth, dstHeight));

    const outCanvas = document.createElement('canvas');
    outCanvas.width = dstWidth;
    outCanvas.height = dstHeight;
    cv.imshow(outCanvas, dst);

    // cleanup
    src.delete();
    contours.delete();
    board.delete();
    srcTri.delete();
    dstTri.delete();
    M.delete();
    dst.delete();

    return outCanvas;
  }
}
