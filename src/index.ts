// import { VisionApp } from '@modules/vision';
// import './styles.css';
// import { bindButton, showMessage } from '@modules/ui';
// import './styles.css';
// console.log('🚀 DOMContentLoaded 触发');
// window.addEventListener('DOMContentLoaded', async () => {
//   console.log('页面初始化开始');
//   // ...
// });
// window.addEventListener('DOMContentLoaded', async () => {
//   const video      = document.getElementById('video')   as HTMLVideoElement;
//   const capture    = document.getElementById('capture') as HTMLCanvasElement;
//   const overlay    = document.getElementById('overlay') as HTMLCanvasElement;
//   const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
//   const quizBtn    = document.getElementById('quizBtn')    as HTMLButtonElement;
//   const app = new VisionApp(video, capture);
//
//   // const app = new VisionApp(video, canvas);
//   await app.start();
//   showMessage('Camera ready. Click capture to analyze.');
//
//   bindButton(captureBtn, async () => {
//     await app.analyze();
//     showMessage('Check console for results');
//   });
//
//   // src/index.ts
//   bindButton(quizBtn, () => {
//     window.location.href = '/topics.html';
//   });
//   const quizPrompt = document.querySelector('.quiz-prompt') as HTMLElement;
//   if (quizPrompt) {
//     quizPrompt.style.cursor = 'pointer';    // 小手型提示
//     quizPrompt.addEventListener('click', () => {
//       window.location.href = '/topics.html';
//     });
//   }
// });
// src/index.ts
// src/index.ts
import { auth } from '@modules/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { VisionApp } from '@modules/vision';
import './styles.css';
import { bindButton, showMessage } from '@modules/ui';

window.addEventListener('DOMContentLoaded', async () => {
  const authBtn   = document.getElementById('authBtn') as HTMLButtonElement;

  // 1) 监听登录状态
  // @ts-ignore
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // 已登录：显示邮箱 + 改成登出按钮
      const emailEl = document.getElementById('userEmail');
      if (emailEl) emailEl.textContent = user.email || '';

      authBtn.textContent = 'Logout';
      authBtn.onclick = async () => {
        await signOut(auth);
        window.location.href = '/login.html';
      };
    } else {
      // 未登录：直接跳到登录页
      window.location.href = '/login.html';
    }
  });

  // 2) 原有的 AR 初始化逻辑不变
  const video      = document.getElementById('video')   as HTMLVideoElement;
  const capture    = document.getElementById('capture') as HTMLCanvasElement;
  const overlay    = document.getElementById('overlay') as HTMLCanvasElement;
  const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
  const quizBtn    = document.getElementById('quizBtn')    as HTMLButtonElement;

  const app = new VisionApp(video, capture);
  await app.start();
  showMessage('Camera ready. Click capture to analyze.');

  bindButton(captureBtn, async () => {
    await app.analyze();
    showMessage('Check console for results');
  });
  bindButton(quizBtn, () => {
    window.location.href = '/topics.html';
  });
});