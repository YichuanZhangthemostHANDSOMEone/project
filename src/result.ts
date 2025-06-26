// src/result.ts
import './styles.css';
document.addEventListener('DOMContentLoaded', () => {
    const recs: { correct: boolean; time: number }[] =
        JSON.parse(sessionStorage.getItem('quizResults') || '[]');

    const total = recs.length;
    const correctCount = recs.filter(r => r.correct).length;
    const totalTime = recs.reduce((sum, r) => sum + r.time, 0);

    (document.getElementById('score') as HTMLElement).textContent =
        `${correctCount}/${total}`;
    (document.getElementById('time') as HTMLElement).textContent =
        `${totalTime}s`;
    const acc = total ? Math.round((correctCount/total)*100) : 0;
    (document.getElementById('acc') as HTMLElement).textContent =
        `${acc}%`;
    const sugg = acc === 100
        ? 'Excellent!'
        : acc >= 80
            ? 'Great job, keep it up!'
            : 'Review the material and try again.';
    (document.getElementById('suggestion') as HTMLElement).textContent = sugg;
});