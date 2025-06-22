import { VisionApp } from '@modules/vision';
import { bindButton, showMessage } from '@modules/ui';
import { onUserChanged, getUserRole } from '@modules/auth';
import './styles.css';

window.addEventListener('DOMContentLoaded', () => {
  onUserChanged(async (user) => {
    if (!user) {
      location.href = '/index.html';
      return;
    }
    const role = await getUserRole(user.uid);
    if (role !== 'student') {
      location.href = '/admin.html';
      return;
    }

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
});
