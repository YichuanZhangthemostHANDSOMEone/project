// import { VisionApp } from '@modules/vision';
// import { bindButton, showMessage } from '@modules/ui';
// import './styles.css';
//
// window.addEventListener('DOMContentLoaded', async () => {
//   const video = document.getElementById('video') as HTMLVideoElement;
//   const canvas = document.getElementById('capture') as HTMLCanvasElement;
//   const button = document.getElementById('captureBtn') as HTMLButtonElement;
//
//   const app = new VisionApp(video, canvas);
//   await app.start();
//   showMessage('Camera ready. Click capture to analyze.');
//   bindButton(button, async () => {
//     await app.analyze();
//     showMessage('Check console for results');
//   });
// });
import { VisionApp } from '@modules/vision';
import { bindButton, showMessage } from '@modules/ui';
import './styles.css';

window.addEventListener('DOMContentLoaded', async () => {
  const video      = document.getElementById('video')       as HTMLVideoElement;
  const canvas     = document.getElementById('capture')     as HTMLCanvasElement;
  const captureBtn = document.getElementById('captureBtn')  as HTMLButtonElement;
  const quizBtn    = document.getElementById('quizBtn')     as HTMLButtonElement;

  const app = new VisionApp(video, canvas);
  await app.start();
  showMessage('Camera ready. Click capture to analyze.');

  bindButton(captureBtn, async () => {
    await app.analyze();
    showMessage('Check console for results');
  });

  bindButton(quizBtn, () => {
    // 这里可以跳到你的 quiz 页面，或者弹出一个模态框
    window.location.href = '/quiz.html';
  });
});
