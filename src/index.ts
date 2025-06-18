import { VisionApp } from '@modules/vision';
import { bindButton, showMessage } from '@modules/ui';
import './styles.css';

window.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('video') as HTMLVideoElement;
  const canvas = document.getElementById('capture') as HTMLCanvasElement;
  const button = document.getElementById('captureBtn') as HTMLButtonElement;

  const app = new VisionApp(video, canvas);
  await app.start();
  showMessage('Camera ready. Click capture to analyze.');
  bindButton(button, async () => {
    await app.analyze();
    showMessage('Check console for results');
  });
});
