import './styles.css';

window.addEventListener('DOMContentLoaded', () => {
  const img = document.getElementById('legoImage') as HTMLImageElement | null;
  const data = sessionStorage.getItem('legoResultImage');
  if (img && data) {
    img.src = data;
  }
  const btn = document.getElementById('returnBtn') as HTMLButtonElement | null;
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
});
