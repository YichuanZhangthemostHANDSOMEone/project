import './styles.css';

window.addEventListener('DOMContentLoaded', () => {
  // 1. 展示导出的图像
  const img = document.getElementById('legoImage') as HTMLImageElement | null;
  const overlay = document.getElementById('resultOverlay') as HTMLCanvasElement | null;
  const rawImage = sessionStorage.getItem('legoResultImage');
  if (img && rawImage) {
    img.src = rawImage;
    console.log('【结果页】展示的 image 长度：', rawImage.length);
  } else {
    console.warn('【结果页】未找到 legoResultImage');
  }

  // 2. 取出识别结果 blocks
  const rawBlocks = sessionStorage.getItem('legoResultBlocks');
  let blocks: any[] = [];
  if (rawBlocks) {
    try {
      blocks = JSON.parse(rawBlocks);
      console.log('【结果页】sessionStorage 中的 blocks：', blocks);
    } catch (e) {
      console.error('【结果页】解析 blocks 出错：', e);
    }
  } else {
    console.warn('【结果页】未找到 legoResultBlocks');
  }

  function draw() {
    if (!img || !overlay) return;
    overlay.width = img.naturalWidth;
    overlay.height = img.naturalHeight;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = '#f00';
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#f00';
    for (const b of blocks) {
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.fillText(b.color, b.x, b.y - 4);
    }
  }

  if (img) {
    if (img.complete) draw();
    else img.addEventListener('load', draw);
  }

  // 3. 绑定返回按钮
  const btn = document.getElementById('returnBtn') as HTMLButtonElement | null;
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
});

