// src/index.ts
import { VisionApp } from '@modules/vision';
import { loadColorMap } from '@modules/colorMap';
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
  const DEBUG = true;

  try {
    await loadColorMap();
    await app.start();
    showMessage('Camera ready. Click capture to analyze.');
  } catch (error) {
    console.error('Failed to start the app:', error);
    showMessage('Failed to start the camera. Please try again later.');
  }

  bindButton(captureBtn, async () => {
    let timer: any;
    if (DEBUG) {
      const cells = await app.analyze();
      console.log('调试模式 cells:', cells);
      return;
    }
    try {
      timer = setTimeout(() => showProcessingSpinner(true), 500);

      // 同时拿到导出的图像和识别结果
      const { image, blocks: cells } = await app.analyzeAndExport();
      console.log('【主页面】导出 image 长度：', image.length);
      console.log('【主页面】识别到的 cells：', cells);

      clearTimeout(timer);
      showProcessingSpinner(false);

      // 存储到 sessionStorage 以便结果页展示
      sessionStorage.setItem('legoResultImage', image);
      sessionStorage.setItem('legoResultBlocks', JSON.stringify(cells));

      window.location.href = '/lego-result.html';
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
