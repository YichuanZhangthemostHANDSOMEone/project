// // src/quiz.ts
// import { db } from '@modules/firebase';
// import { Question } from '@modules/data/questions';
// import './styles.css';
//
// // 调试输出
// console.log('📦 Firestore db =', db);
// console.log('🔑 FIREBASE_API_KEY =', process.env.FIREBASE_API_KEY);
//
// import {
//     collection, query, where, getDocs, orderBy
// } from 'firebase/firestore';
//
// function getWeek(): number {
//     const wk = parseInt(new URLSearchParams(location.search).get('week') || '', 10);
//     return isNaN(wk) ? 0 : wk;
// }
//
// let current = 0;
// let qs: Question[] = [];
//
// document.addEventListener('DOMContentLoaded', async () => {
//     try {
//         const week = getWeek();
//         const col  = collection(db, 'questions');
//         const q    = query(col, where('week', '==', week), orderBy('id', 'asc'));
//         const snap = await getDocs(q);
//
//         qs = snap.empty
//             ? []
//             : snap.docs.map(d => {
//                 const data = d.data() as any;
//                 return { id: data.id, prompt: data.prompt, options: data.options };
//             });
//     } catch (e) {
//         console.error('❌ Firestore fetch error:', e);
//         qs = [];
//     }
//
//     if (qs.length === 0) {
//         const c = document.getElementById('quizContainer');
//         if (c) c.innerHTML = `<p style="padding:1rem;text-align:center;">empty question here</p>`;
//         return;
//     }
//
//     bindUI();
//     renderQuestion();
//     document.getElementById('nextBtn')?.addEventListener('click', () => navigate(1));
//     document.getElementById('prevBtn')?.addEventListener('click', () => navigate(-1));
// });
//
// function bindUI() { /* … */ }
// function renderQuestion() {
//     // prompt 和 options （你有）
//     document.getElementById('prompt')
//     document.querySelectorAll('.option-btn')
//
// // 进度条和计数（如果拿到题，就要更新，否则 on empty 就 return）
//     document.getElementById('counter')              // 更新 “1 / N”
//     document.querySelector<HTMLElement>('.progress') // 更新 .style.width
//     document.getElementById('nextBtn')
//     document.getElementById('prevBtn')
// }
//
// function navigate(delta: number) { /* … */ }

// src/quiz.ts
import { db } from '@modules/firebase';

import './styles.css';
// …拉完题目、映射成 qs 以后，紧接着：
// @ts-ignore
// console.log('✏️ qs length =', qs.length, 'contents=', qs);
import {
    collection, query, where, getDocs, orderBy
} from 'firebase/firestore';

function getWeek(): number {
    const wk = parseInt(new URLSearchParams(location.search).get('week') || '', 10);
    return isNaN(wk) ? 0 : wk;
}

let current = 0;
interface QuizQuestion {
    id: number;
    prompt: string;
    options: string[];
}

let qs: QuizQuestion[] = [];

// ① 绑定选项点击高亮
function bindUI() {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.option-btn'));
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 先把所有按钮的 selected 样式清掉
            buttons.forEach(b => b.classList.remove('selected'));
            // 然后给当前按钮加上
            btn.classList.add('selected');
        });
    });
}

// ② 渲染当前题：题干 / 选项 / 进度条 & 计数
function renderQuestion() {
    const q = qs[current];

    // 渲染题干
    const promptEl = document.getElementById('prompt')!;
    promptEl.textContent = q.prompt;

    // 渲染选项文本 & 禁用多余按钮，同时清掉之前的高亮
    const optionBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('.option-btn'));
    optionBtns.forEach((btn, i) => {
        const txt = q.options[i] || '';
        btn.textContent = txt;
        btn.disabled = txt === '';
        btn.classList.remove('selected');
    });

    // 渲染进度计数
    const counter = document.getElementById('counter')!;
    counter.textContent = `${current + 1} / ${qs.length}`;

    // 渲染进度条宽度
    const progress = document.querySelector<HTMLElement>('.progress')!;
    progress.style.width = `${((current + 1) / qs.length) * 100}%`;
}

// ③ 翻页逻辑：前一题 / 下一题 / 完成跳结果页
function navigate(delta: number) {
    current += delta;
    if (current < 0) {
        current = 0;
    } else if (current >= qs.length) {
        // 全部答完，跳到结果页
        location.href = `/result.html?week=${getWeek()}`;
        return;
    }
    renderQuestion();
}

// 主流程
document.addEventListener('DOMContentLoaded', async () => {
    // 拉题
    const week = getWeek();
    const col  = collection(db, 'questions');
    const q    = query(col, where('week', '==', week), orderBy('id', 'asc'));
    // @ts-ignore
    const snap = await getDocs(q).catch(e => {
        console.error('❌ Firestore fetch error:', e);
        return { empty: true, docs: [] as any[] } as typeof snap;
    });

    qs = snap.empty
        ? []
        : snap.docs.map((d: { data: () => any; }) => {
            const data = d.data() as any;
            return { id: data.id, prompt: data.prompt, options: data.options };
        });

    // 如果真没题，显示提示
    if (qs.length === 0) {
        const c = document.getElementById('quizContainer');
        if (c) c.innerHTML = `<p style="padding:1rem;text-align:center;">empty question here</p>`;
        return;
    }

    // 正常走渲染
    bindUI();
    renderQuestion();

    // 绑定翻页按钮
    document.getElementById('prevBtn')?.addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn')?.addEventListener('click', () => navigate(1));
});