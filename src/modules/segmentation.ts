// src/segmentation.ts
import { FilesetResolver, ImageSegmenter, ImageSegmenterResult } from '@mediapipe/tasks-vision';
import { showMessage } from '@modules/ui';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const MODEL_URL = `https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite?api_key=${ROBOFLOW_API_KEY}`;

export class LegoSegmenter {
  private segmenter?: any;

  async init() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      this.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: 'IMAGE',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
        // 如果你需要多边形路径，可打开下一行
        // outputPolygonMasks: true,
      });
    } catch (err) {
      showMessage('Failed to load segmentation model');
      throw err;
    }
  }

  async segment(image: HTMLCanvasElement): Promise<any | null> {
    if (!this.segmenter) return null;
    const result = this.segmenter.segment(image);
    if (!result || !result.categoryMask) {
      console.warn('Segmentation returned no valid category mask');
      return null;
    }

    // 检查是否含前景
    const maskData = result.categoryMask.getAsUint8Array();
    const hasForeground = maskData.some((v: number) => v > 0);
    if (!hasForeground) {
      console.warn('Segmentation mask contains only background pixels');
    }
    return result;
  }
}
