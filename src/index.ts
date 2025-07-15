// src/index.ts
import { VisionApp } from '@modules/vision';
import './styles.css';
import { bindButton, showMessage, showProcessingSpinner } from '@modules/ui';

console.log('🚀 DOMContentLoaded 触发');
window.addEventListener('DOMContentLoaded', async () => {
  console.log('页面初始化开始');
  const video      = document.getElementById('video')      as HTMLVideoElement;
  const capture    = document.getElementById('capture')    as HTMLCanvasElement;
  const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
  const quizBtn    = document.getElementById('quizBtn')    as HTMLButtonElement;
  const overlay    = document.getElementById('overlay')    as HTMLCanvasElement;

  const app = new VisionApp(video, capture, overlay);

  try {
    await app.start();
    showMessage('Camera ready. Click capture to analyze.');
  } catch (error) {
    console.error('Failed to start the app:', error);
    showMessage('Failed to start the camera. Please try again later.');
  }

  bindButton(captureBtn, async () => {
    let timer: any;
    try {
      timer = setTimeout(() => showProcessingSpinner(true), 500);

      // —— 这里改动 ——
      // 1) 同时拿到 image 和 blocks
      const { image, blocks } = await app.analyzeAndExport();
      // 2) 打印日志
      console.log('【主页面】导出 image 长度：', image.length);
      console.log('【主页面】识别到的 blocks：', blocks);
      // —— 结束改动 ——

      clearTimeout(timer);
      showProcessingSpinner(false);

      // // 存储到 sessionStorage
      // sessionStorage.setItem('legoResultImage', image);
      // // —— 同时存储 blocks
      // sessionStorage.setItem('legoResultBlocks', JSON.stringify(blocks));
      //
      // window.location.href = '/lego-result.html';
    } catch (error) {
      clearTimeout(timer);
      showProcessingSpinner(false);
      console.error('Analysis failed:', error);
      showMessage('An error occurred during analysis. Please try again.');
    }
  });

  bindButton(quizBtn, () => {
    window.location.href = '/topics.html';
  });

  const quizPrompt = document.querySelector('.quiz-prompt') as HTMLElement;
  if (quizPrompt) {
    quizPrompt.classList.add('clickable');
    quizPrompt.addEventListener('click', () => {
      window.location.href = '/topics.html';
    });
  }
});
