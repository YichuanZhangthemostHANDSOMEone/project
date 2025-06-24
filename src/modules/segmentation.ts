import { FilesetResolver, ImageSegmenter, ImageSegmenterResult } from '@mediapipe/tasks-vision';
import { showMessage } from '@modules/ui';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const MODEL_URL = `https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite?api_key=${ROBOFLOW_API_KEY}`;

export class LegoSegmenter {
  private segmenter?: ImageSegmenter;

  async init() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      this.segmenter = await ImageSegmenter.createFromOptions(
          vision,
          {
            baseOptions: { modelAssetPath: MODEL_URL },
            runningMode: 'IMAGE',
            outputCategoryMask: true,          // 需要分类掩码
            outputConfidenceMasks: false
          }
      );
    } catch (err) {
      showMessage('Failed to load segmentation model');
      throw err;
    }
  }

  async segment(image: HTMLCanvasElement): Promise<ImageSegmenterResult | null> {
    if (!this.segmenter) return null;
    return this.segmenter.segment(image);
  }
}
