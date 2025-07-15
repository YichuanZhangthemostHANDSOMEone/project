// src/modules/segmentation.ts

// 让 TS 知道 process.env.ROBOFLOW_API_KEY 存在
declare const process: {
  env: {
    ROBOFLOW_API_KEY: string;
  };
};

export interface Prediction {
  mask:    string;      // data:image/png;base64,...
  polygon?: number[];   // optional
  x:       number;
  y:       number;
  width:   number;
  height:  number;
}

export class LegoSegmenter {
  // 从环境变量读取，不要直接写硬编码
  private readonly apiKey    = process.env.ROBOFLOW_API_KEY;
  private readonly modelSlug = 'vetherblocks/lego-plate-segmentation';
  private readonly version   = 1;

  async segment(canvas: HTMLCanvasElement): Promise<Prediction[]|null> {
    if (!this.apiKey) {
      throw new Error('Missing ROBOFLOW_API_KEY in process.env');
    }

    // 1. Canvas → JPEG Base64，去掉前缀
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    const base64  = dataURL.split(',')[1];

    // 2. 拼接 Serverless API URL
    const url =
        `https://serverless.roboflow.com/` +
        `${this.modelSlug}/${this.version}` +
        `?api_key=${this.apiKey}` +
        `&format=masks`;

    // 3. 直接用 fetch 发 simple POST（不带任何额外 headers）
    const resp = await fetch(url, {
      method: 'POST',
      body: base64
    });

    if (!resp.ok) {
      console.error(`Roboflow API 请求失败: ${resp.status} ${resp.statusText}`);
      return null;
    }

    // 4. 解析返回
    const json = await resp.json();
    const preds = (json.predictions || []) as Prediction[];
    if (!preds.length) {
      console.warn('Roboflow 返回空 predictions');
      return null;
    }
    return preds;
  }
}
