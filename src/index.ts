
import { VisionApp } from '@modules/vision';
import './styles.css';
import { bindButton, showMessage, showProcessingSpinner } from '@modules/ui';
import './styles.css';
console.log('🚀 DOMContentLoaded 触发');
window.addEventListener('DOMContentLoaded', async () => {
  console.log('页面初始化开始');
  const video = document.getElementById('video') as HTMLVideoElement;
  const capture = document.getElementById('capture') as HTMLCanvasElement;
  const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
  const quizBtn = document.getElementById('quizBtn') as HTMLButtonElement;
  const overlay = document.getElementById('overlay') as HTMLCanvasElement;
  const app = new VisionApp(video, capture, overlay);

  // const app = new VisionApp(video, canvas);
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
      const { image } = await app.analyzeAndExport();
      clearTimeout(timer);
      showProcessingSpinner(false);
      sessionStorage.setItem('legoResultImage', image);
      window.location.href = '/lego-result.html';
    } catch (error) {
      clearTimeout(timer);
      showProcessingSpinner(false);
      console.error('Analysis failed:', error);
      showMessage('An error occurred during analysis. Please try again.');
    }
  });

  // 统一使用 bindButton 来绑定 quizBtn 的点击事件
  bindButton(quizBtn, () => {
    window.location.href = '/topics.html';
  });

  const quizPrompt = document.querySelector('.quiz-prompt') as HTMLElement;
  if (quizPrompt) {
    quizPrompt.classList.add('clickable'); // 使用 CSS 类名代替直接样式修改
    quizPrompt.addEventListener('click', () => {
      window.location.href = '/topics.html';
    });
  }
});

