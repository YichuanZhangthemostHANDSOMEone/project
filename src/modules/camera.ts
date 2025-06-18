export class Camera {
  constructor(private video: HTMLVideoElement) {}

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    this.video.srcObject = stream;
    await this.video.play();
  }

  capture(target: HTMLCanvasElement): CanvasRenderingContext2D {
    target.width = this.video.videoWidth;
    target.height = this.video.videoHeight;
    const ctx = target.getContext('2d')!;
    ctx.drawImage(this.video, 0, 0, target.width, target.height);
    return ctx;
  }
}
