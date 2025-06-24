// import { Camera } from '@modules/camera';
// import { LegoSegmenter } from '@modules/segmentation';
// import { prominent } from 'color.js';
//
// export class VisionApp {
//   private camera: Camera;
//   private segmenter: LegoSegmenter;
//   private capturingCanvas: HTMLCanvasElement;
//
//   constructor(private video: HTMLVideoElement, canvas: HTMLCanvasElement) {
//     this.camera = new Camera(video);
//     this.segmenter = new LegoSegmenter();
//     this.capturingCanvas = canvas;
//   }
//
//   async start() {
//     try {
//       console.log('📷 准备打开摄像头');
//       await this.camera.start();
//       console.log('📷 摄像头已启动');
//       await this.segmenter.init();
//     } catch (e) {
//       console.error('打开摄像头出错:', e);
//     }
//   }
//
//   // async analyze() {
//   //   // 1. 拍照
//   //   const ctx = this.camera.capture(this.capturingCanvas);
//   //
//   //   // 2. 分割
//   //   const result = await this.segmenter.segment(this.capturingCanvas);
//   //   if (!result) return;
//   //
//   //   // 3. 主色提取
//   //   const color = await prominent(this.capturingCanvas, { amount: 1 });
//   //   console.log('Dominant color:', color);
//   //
//   //   // 4. 输出分割结果
//   //   console.log('Segmentation result:', result);
//   // }
//   // async analyze() {
//   //   // 1. 拍照
//   //   const ctx = this.camera.capture(this.capturingCanvas);
//   //
//   //   // 2. 分割
//   //   const result = await this.segmenter.segment(this.capturingCanvas);
//   //   if (!result) return;
//   //
//   //   // 3. 主色提取
//   //   const dataUrl = this.capturingCanvas.toDataURL();
//   //   try {
//   //     const color = await prominent(dataUrl, { amount: 1 });
//   //     console.log('Dominant color:', color);
//   //   } catch (e) {
//   //     console.error('Color extraction failed:', e);
//   //   }
//   //
//   //   // 4. 输出分割结果
//   //   console.log('Segmentation result:', result);
//   // }
//   async analyze() {
//     // 1. 拍照到隐藏的 canvas
//     this.camera.capture(this.capturingCanvas);
//
//     // 2. 分割
//     const result = await this.segmenter.segment(this.capturingCanvas);
//     if (!result?.categoryMask) {
//       console.warn('No segmentation mask returned');
//       return;
//     }
//
//     // 3. 在 overlay 上绘制掩码
//     const mask = result.categoryMask;
//     // 从 ArrayBuffer 构造一维字节数组
//     const raw = new Uint8ClampedArray(mask.buffer);
//     const w = mask.width, h = mask.height;
//
//     // 把单通道掩码转成 RGBA，其中所有非 0 的像素都用半透明红色
//     const rgba = new Uint8ClampedArray(w * h * 4);
//     for (let i = 0, j = 0; i < raw.length; i++, j += 4) {
//       if (raw[i] > 0) {
//         rgba[j]   = 255;  // R
//         rgba[j+1] =   0;  // G
//         rgba[j+2] =   0;  // B
//         rgba[j+3] = 128;  // A
//       } else {
//         rgba[j+3] = 0;    // 完全透明
//       }
//     }
//     const imgData = new ImageData(rgba, w, h);
//
//     // 临时画布把掩码放进去，然后缩放到 overlay
//     const tmp = document.createElement('canvas');
//     tmp.width  = w;
//     tmp.height = h;
//     tmp.getContext('2d')!.putImageData(imgData, 0, 0);
//
//     const overlay = document.getElementById('overlay') as HTMLCanvasElement;
//     overlay.width  = this.capturingCanvas.width;
//     overlay.height = this.capturingCanvas.height;
//     const octx = overlay.getContext('2d')!;
//     octx.clearRect(0, 0, overlay.width, overlay.height);
//
//     // 绘制半透明掩码
//     octx.globalAlpha = 1;
//     octx.drawImage(tmp, 0, 0, overlay.width, overlay.height);
//
//     // 4. 更新顶部的 Step 提示（如无多步可硬编码）
//     const stepEl = document.getElementById('step-indicator');
//     if (stepEl) {
//       stepEl.textContent = 'Segmentation complete';
//     }
//
//     // 5. （可选）主色提取示例
//     try {
//       const dataUrl = this.capturingCanvas.toDataURL();
//       const color = await prominent(dataUrl, { amount: 1 });
//       console.log('Dominant color:', color);
//     } catch (e) {
//       console.error('Color extraction failed:', e);
//     }
//
//     // 6. （可选）底部信息栏填充
//     const infoEl = document.getElementById('packet-info');
//     if (infoEl) {
//       infoEl.textContent = `Mask: ${w}×${h} pixels`;
//     }
//   }
// }
// src/modules/vision.ts

import { Camera } from '@modules/camera';
import { LegoSegmenter } from '@modules/segmentation';
import { prominent } from 'color.js';

export class VisionApp {
  private camera: Camera;
  private segmenter: LegoSegmenter;
  private capturingCanvas: HTMLCanvasElement;

  constructor(private video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.camera = new Camera(video);
    this.segmenter = new LegoSegmenter();
    this.capturingCanvas = canvas;
  }

  async start() {
    try {
      console.log('📷 准备打开摄像头');
      await this.camera.start();
      console.log('📷 摄像头已启动');
      await this.segmenter.init();
    } catch (e) {
      console.error('打开摄像头出错:', e);
    }
  }

  async analyze() {
    // 1. 拍照
    this.camera.capture(this.capturingCanvas);

    // 2. 分割
    const result = await this.segmenter.segment(this.capturingCanvas);
    if (!result?.categoryMask) {
      console.warn('No segmentation mask returned');
      return;
    }

    // 先打印一下，看看 runtime 上它到底长哪些字段
    console.log('🔍 categoryMask:', result.categoryMask);

    // 3. 尝试取原始掩码字节
    const mask = result.categoryMask;
    // TS 接口上没有 data/buffer/getBuffer，这里 cast to any
    const anyMask = mask as any;
    let raw: Uint8ClampedArray;

    if (anyMask.data instanceof Uint8ClampedArray) {
      raw = anyMask.data;
    } else if (anyMask.buffer instanceof ArrayBuffer) {
      raw = new Uint8ClampedArray(anyMask.buffer);
    } else if (typeof anyMask.getBuffer === 'function') {
      raw = new Uint8ClampedArray(anyMask.getBuffer());
    } else {
      throw new Error('无法读取 segmentation mask 的原始数据');
    }

    const w = mask.width;
    const h = mask.height;

    // 4. 构造 RGBA 半透明红色掩码
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0, j = 0; i < raw.length; i++, j += 4) {
      if (raw[i] > 0) {
        rgba[j  ] = 255;  // R
        rgba[j+1] =   0;  // G
        rgba[j+2] =   0;  // B
        rgba[j+3] = 128;  // A
      } else {
        rgba[j+3] = 0;    // 完全透明
      }
    }
    const imgData = new ImageData(rgba, w, h);

    // 5. 临时画布放掩码，再绘制到 overlay
    const tmp = document.createElement('canvas');
    tmp.width  = w;
    tmp.height = h;
    tmp.getContext('2d')!.putImageData(imgData, 0, 0);

    const overlay = document.getElementById('overlay') as HTMLCanvasElement;
    overlay.width  = this.capturingCanvas.width;
    overlay.height = this.capturingCanvas.height;
    const octx = overlay.getContext('2d')!;
    octx.clearRect(0, 0, overlay.width, overlay.height);

    octx.globalAlpha = 0.4;
    octx.drawImage(tmp, 0, 0, overlay.width, overlay.height);
    octx.globalAlpha = 1;

    // 6. 更新顶部 Step 文本
    const stepEl = document.getElementById('step-indicator');
    if (stepEl) stepEl.textContent = 'Segmentation complete';

    // 7. （示例）主色提取
    try {
      const dataUrl = this.capturingCanvas.toDataURL();
      const color = await prominent(dataUrl, { amount: 1 });
      console.log('Dominant color:', color);
    } catch (e) {
      console.error('Color extraction failed:', e);
    }

    // 8. （示例）底部信息栏
    const infoEl = document.getElementById('packet-info');
    if (infoEl) {
      infoEl.textContent = `Mask: ${w}×${h} px`;
    }
  }
}