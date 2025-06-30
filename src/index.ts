//
// // src/index.ts
// import { auth } from '@modules/firebase';
// import { onAuthStateChanged, signOut, User } from 'firebase/auth';
// import { VisionApp } from '@modules/vision';
// import './styles.css';
// import { bindButton, showMessage } from '@modules/ui';
//
// window.addEventListener('DOMContentLoaded', async () => {
//   const authBtn   = document.getElementById('authBtn') as HTMLButtonElement;
//
//   // 1) 监听登录状态
//   // @ts-ignore
//   onAuthStateChanged(auth, async (user: User | null) => {
//     if (user) {
//       // 已登录：显示邮箱 + 改成登出按钮
//       const emailEl = document.getElementById('userEmail');
//       if (emailEl) emailEl.textContent = user.email || '';
//
//       authBtn.textContent = 'Logout';
//       authBtn.onclick = async () => {
//         await signOut(auth);
//         window.location.href = '/login.html';
//       };
//     } else {
//       // 未登录：直接跳到登录页
//       window.location.href = '/login.html';
//     }
//   });
//
//   // 2) 原有的 AR 初始化逻辑不变
//   const video      = document.getElementById('video')   as HTMLVideoElement;
//   const capture    = document.getElementById('capture') as HTMLCanvasElement;
//   const overlay    = document.getElementById('overlay') as HTMLCanvasElement;
//   const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
//   const quizBtn    = document.getElementById('quizBtn')    as HTMLButtonElement;
//
//   const app = new VisionApp(video, capture);
//   await app.start();
//   showMessage('Camera ready. Click capture to analyze.');
//
//   bindButton(captureBtn, async () => {
//     await app.analyze();
//     showMessage('Check console for results');
//   });
//   bindButton(quizBtn, () => {
//     window.location.href = '/topics.html';
//   });
// });

// // src/index.ts
// import { auth } from '@modules/firebase';
// import { onAuthStateChanged, signOut, User } from 'firebase/auth';
// import { VisionApp } from '@modules/vision';
// import './styles.css';
// import { bindButton, showMessage } from '@modules/ui';
//
// window.addEventListener('DOMContentLoaded', async () => {
//   // 1️⃣ 顶栏登录状态 & 头像
//   const authBtn     = document.getElementById('authBtn')     as HTMLButtonElement;
//   const avatarImg   = document.getElementById('userAvatar') as HTMLImageElement;
//   const welcomeText = document.getElementById('welcomeText') as HTMLElement;
//
//   // @ts-ignore
//   onAuthStateChanged(auth, async (user: User | null) => {
//     if (user) {
//       const seed = encodeURIComponent(user.email || '');
//       avatarImg.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
//       avatarImg.onerror = () => { avatarImg.src = '/assets/default-avatar.svg'; };
//       welcomeText.textContent = `Welcome, ${user.email}`;
//       authBtn.textContent = 'Logout';
//       authBtn.onclick = async () => {
//         await signOut(auth);
//         window.location.href = '/login.html';
//       };
//     } else {
//       window.location.href = '/login.html';
//     }
//   });

import { auth, db } from '@modules/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { VisionApp } from '@modules/vision';
import './styles.css';
import { bindButton, showMessage } from '@modules/ui';

window.addEventListener('DOMContentLoaded', async () => {
  const authBtn   = document.getElementById('authBtn') as HTMLButtonElement;
  const recordBtn = document.getElementById('recordBtn') as HTMLAnchorElement;

  // @ts-ignore
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // 头像与登出逻辑…
      recordBtn.onclick = async e => {
        e.preventDefault();
        const snap = await getDoc(doc(db, 'users', user.uid));
        const role = snap.exists() ? snap.data().role : 'student';
        window.location.href = role === 'teacher'
            ? '/teacher_record.html'
            : '/student_record.html';
      };
    } else {
      window.location.href = '/login.html';
    }
  });
  // 2️⃣ AR 扫描逻辑
  const videoEl       = document.getElementById('video')      as HTMLVideoElement;
  const captureCanvas = document.getElementById('capture')    as HTMLCanvasElement | null;
  const overlayCanvas = document.getElementById('overlay')    as HTMLCanvasElement;
  const captureBtn    = document.getElementById('captureBtn') as HTMLButtonElement;
  const quizBtn       = document.getElementById('quizBtn')    as HTMLButtonElement;

  if (!captureCanvas) {
    console.error('❌ 找不到 <canvas id="capture">，请检查 HTML');
    return;
  }

  const app = new VisionApp(videoEl, captureCanvas);
  await app.start();
  showMessage('Camera ready. Click capture to analyze.');

  bindButton(captureBtn, async () => {
    await app.analyze();
    showMessage('Analysis complete. See console for details.');
  });
  bindButton(quizBtn, () => {
    window.location.href = '/topics.html';
  });
});