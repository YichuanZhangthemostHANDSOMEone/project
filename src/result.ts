// 这里可以从 localStorage 或 URL params 拿到 score/time/accuracy
// Demo 中直接写死
import './styles.css';
document.addEventListener('DOMContentLoaded', () => {
    (document.getElementById('score') as HTMLElement).textContent = '30/50';
    (document.getElementById('time') as HTMLElement).textContent = '2min 43s';
    (document.getElementById('acc') as HTMLElement).textContent = '60%';
    (document.getElementById('suggestion') as HTMLElement).textContent = 'Your suggestions here';
});