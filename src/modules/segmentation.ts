import { InferenceEngine, CVImage } from "inferencejs";

export interface Prediction {
  mask: string;         // Base64 PNG
  polygon?: number[];   // 若需要多边形坐标
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * LegoSegmenter: 在线调用 Roboflow Serverless 分割模型
 */
export class LegoSegmenter {
  private engine!: InferenceEngine;
  private workerId!: string;

  constructor(
      private readonly modelSlug = "vetherblocks/lego-plate-segmentation",
      private readonly version   = "1",
      private readonly apiKey    = process.env.ROBOFLOW_API_KEY
  ) {}

  /**
   * 初始化 InferenceJS 引擎并启动 worker
   */
  async init(): Promise<void> {
    this.engine = new InferenceEngine();
    this.workerId = await this.engine.startWorker(
        this.modelSlug,
        Number(this.version),
        this.apiKey
    );
  }

  /**
   * 对 Canvas 分割，返回封装好的 Prediction 数组
   */
  async segment(
      canvas: HTMLCanvasElement
  ): Promise<Prediction[] | null> {
    if (!this.engine || !this.workerId) return null;

    // 转成 ImageBitmap → CVImage
    const bitmap = await createImageBitmap(canvas);
    const img    = new CVImage(bitmap);

    // 调用 infer，不带额外 options
    const rawResult = await this.engine.infer(this.workerId, img);

    // TS: 强制转换为我们需要的格式
    const preds = (rawResult as any).predictions as Prediction[];
    if (!preds?.length) {
      console.warn("No segmentation predictions from Roboflow");
      return null;
    }
    return preds;
  }
}
