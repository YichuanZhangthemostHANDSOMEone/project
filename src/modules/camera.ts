import { showMessage } from '@modules/ui';

export class Camera {
  constructor(private video: HTMLVideoElement) {}

  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      this.video.srcObject = stream;
      await this.video.play();
    } catch (err) {
      showMessage('Camera permission denied');
      throw err;
    }
  }

  capture(target: HTMLCanvasElement): CanvasRenderingContext2D {
    target.width = this.video.videoWidth;
    target.height = this.video.videoHeight;
    const ctx = target.getContext('2d')!;
    ctx.drawImage(this.video, 0, 0, target.width, target.height);
    return ctx;
  }
}
