// src/result.ts
import './styles.css';

interface RecordItem {
    correct: boolean;
    time: number;
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. 从 sessionStorage 取出所有答题记录
    const recs: RecordItem[] = JSON.parse(
        sessionStorage.getItem('quizResults') || '[]'
    );

    // 2. 计算各项数据
    const total       = recs.length;
    const correctCnt  = recs.filter(r => r.correct).length;
    const totalTime   = recs.reduce((sum, r) => sum + r.time, 0);
    const accuracy    = total ? Math.round((correctCnt / total) * 100) : 0;

    // 3. 更新中间的大百分比数字
    const percentEl = document.getElementById('percent');
    if (percentEl) percentEl.textContent = `${accuracy}%`;

    // 4. 更新环形进度条
    const circle = document.querySelector<SVGCircleElement>('.progress');
    if (circle) {
        const radius        = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        circle.style.strokeDasharray  = `${circumference}`;
        circle.style.strokeDashoffset = `${circumference * (1 - accuracy / 100)}`;
    }

    // 5. 更新得分文字（“correct / total”）
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = `${correctCnt} / ${total}`;

    // 6. 更新总耗时
    const timeEl = document.getElementById('time');
    if (timeEl) timeEl.textContent = `${totalTime}s`;

    // 7. 更新正确率文字
    const accEl = document.getElementById('acc');
    if (accEl) accEl.textContent = `${accuracy}%`;

    // 8. 更新建议文本
    const suggEl = document.getElementById('suggestion');
    if (suggEl) {
        const text =
            accuracy === 100
                ? 'Excellent! 🎉'
                : accuracy >= 80
                    ? 'Great job, keep it up! 👍'
                    : 'Review the material and try again.';
        suggEl.textContent = text;
    }

    // 9. 重考 & 回首页按钮
    document.getElementById('retakeBtn')?.addEventListener('click', () => {
        sessionStorage.removeItem('quizResults');
        // 保持原周次参数重考
        const week = new URLSearchParams(location.search).get('week');
        window.location.href = `/quiz.html?week=${week}`;
    });
    document.getElementById('homeBtn')?.addEventListener('click', () => {
        window.location.href = '/';
    });
});