import { FilesetResolver, ImageSegmenter, ImageSegmenterResult } from '@mediapipe/tasks-vision';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const MODEL_URL = `https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite?api_key=${ROBOFLOW_API_KEY}`;

export class LegoSegmenter {
  private segmenter?: ImageSegmenter;

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
    );
    this.segmenter = await ImageSegmenter.createFromModelPath(vision, MODEL_URL);
  }

  async segment(image: HTMLCanvasElement): Promise<ImageSegmenterResult | null> {
    if (!this.segmenter) return null;
    return this.segmenter.segment(image);
  }
}
