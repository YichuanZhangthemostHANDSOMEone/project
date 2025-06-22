import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

const ROBOFLOW_API_KEY = 'rf_wTNbY7mGHVVON6FGybQgsKPfmkP2';
const MODEL_URL = `https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite?api_key=${ROBOFLOW_API_KEY}`;

export class LegoSegmenter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private segmenter?: any;

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
    );
    this.segmenter = await ImageSegmenter.createFromModelPath(vision, MODEL_URL);
  }

  async segment(image: HTMLCanvasElement): Promise<any | null> {
    if (!this.segmenter) return null;
    return this.segmenter.segment(image);
  }
}
