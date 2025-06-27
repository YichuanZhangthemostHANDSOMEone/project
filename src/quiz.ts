import { questionsByWeek, Question } from '@modules/data/questions';
import './styles.css';

function getWeek(): number {
    const qp = new URLSearchParams(location.search);
    const wk = parseInt(qp.get('week') || '', 10);
    return isNaN(wk) ? 0 : wk;
}

let current = 0;
let qs: Question[] = [];

document.addEventListener('DOMContentLoaded', () => {
    const week = getWeek();
    qs = questionsByWeek[week] || [];

    // 如果根本没有题，直接跳到结果页或显示提示
    if (qs.length === 0) {
        // 1) 跳结果页
        // location.href = `/result.html?week=${week}`;
        // 2) 或本页显示一个“无题目”提示
        const container = document.getElementById('quizContainer');
        if (container) {
            container.innerHTML = `<p>本周暂无题目，请返回上一页选择其他周。</p>`;
        }
        return;
    }

    bindUI();
    renderQuestion();

    // 绑定翻页按钮
    document.getElementById('nextBtn')?.addEventListener('click', () => navigate(1));
    document.getElementById('prevBtn')?.addEventListener('click', () => navigate(-1));
});

function bindUI() {
    // 仅做 UI 效果绑定
    document.querySelectorAll<HTMLButtonElement>('.option-btn')
        .forEach(btn => btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
        }));
}

function renderQuestion() {
    const q = qs[current];
    if (!q) {
        console.error(`第 ${current} 道题不存在`, qs);
        return;
    }

    // 渲染 prompt
    const promptEl = document.getElementById('prompt');
    if (promptEl) {
        promptEl.textContent = q.prompt;
    }

    // 渲染选项
    document.querySelectorAll<HTMLButtonElement>('.option-btn')
        .forEach((btn, i) => {
            btn.textContent = q.options[i] || '';
            btn.disabled = !q.options[i];
        });

    // 渲染进度
    const counter = document.getElementById('counter');
    if (counter) {
        counter.textContent = `${current + 1} / ${qs.length}`;
    }
    const progress = document.querySelector<HTMLElement>('.progress');
    if (progress) {
        progress.style.width = `${((current + 1) / qs.length) * 100}%`;
    }
}

function navigate(delta: number) {
    current += delta;
    // 边界处理
    if (current < 0) {
        current = 0;
    } else if (current >= qs.length) {
        // 全部做完，跳结果页
        location.href = `/result.html?week=${getWeek()}`;
        return;
    }
    renderQuestion();
}