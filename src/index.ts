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
import './styles.css';
import { bindButton, showMessage } from '@modules/ui';
import './styles.css';
console.log('🚀 DOMContentLoaded 触发');
window.addEventListener('DOMContentLoaded', async () => {
  console.log('页面初始化开始');
  // ...
});
window.addEventListener('DOMContentLoaded', async () => {
  const video      = document.getElementById('video')   as HTMLVideoElement;
  const capture    = document.getElementById('capture') as HTMLCanvasElement;
  const overlay    = document.getElementById('overlay') as HTMLCanvasElement;
  const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
  const quizBtn    = document.getElementById('quizBtn')    as HTMLButtonElement;
  const app = new VisionApp(video, capture);

  // const app = new VisionApp(video, canvas);
  await app.start();
  showMessage('Camera ready. Click capture to analyze.');

  bindButton(captureBtn, async () => {
    await app.analyze();
    showMessage('Check console for results');
    // 自动滚动到结果区
        document
      .getElementById('result')!
     .scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // src/index.ts
  bindButton(quizBtn, () => {
    window.location.href = '/topics.html';

  });
  const quizPrompt = document.querySelector('.quiz-prompt') as HTMLElement;
  if (quizPrompt) {
    quizPrompt.style.cursor = 'pointer';    // 小手型提示
    quizPrompt.addEventListener('click', () => {
      window.location.href = '/topics.html';
    });
  }
});

