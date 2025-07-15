import './styles.css';

window.addEventListener('DOMContentLoaded', () => {
  // 1. 展示导出的图像
  const img = document.getElementById('legoImage') as HTMLImageElement | null;
  const rawImage = sessionStorage.getItem('legoResultImage');
  if (img && rawImage) {
    img.src = rawImage;
    console.log('【结果页】展示的 image 长度：', rawImage.length);
  } else {
    console.warn('【结果页】未找到 legoResultImage');
  }

  // 2. 取出并打印识别结果 blocks
  const rawBlocks = sessionStorage.getItem('legoResultBlocks');
  if (rawBlocks) {
    try {
      const blocks = JSON.parse(rawBlocks);
      console.log('【结果页】sessionStorage 中的 blocks：', blocks);
    } catch (e) {
      console.error('【结果页】解析 blocks 出错：', e);
    }
  } else {
    console.warn('【结果页】未找到 legoResultBlocks');
  }

  // 3. 绑定返回按钮
  const btn = document.getElementById('returnBtn') as HTMLButtonElement | null;
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
});

