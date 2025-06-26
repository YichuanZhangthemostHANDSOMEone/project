// src/quiz.ts
import { db } from '@modules/firebase';
import './styles.css';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

// 随机打乱
function shuffleArray<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getWeek(): number {
    const wk = parseInt(new URLSearchParams(location.search).get('week') || '', 10);
    return isNaN(wk) ? 0 : wk;
}

const TIME_PER_QUESTION = 40;
let timerInterval: number | undefined;
let questionStartTime = 0;

interface QuizQuestion {
    id: number;
    prompt: string;
    options: string[];
    correctIndex: number;    // 新增：正确答案下标
}

let current = 0;
let qs: QuizQuestion[] = [];

// 清除
function clearTimer() {
    if (timerInterval !== undefined) {
        clearInterval(timerInterval);
    }
}

// 启动倒计时
function startTimer() {
    clearTimer();
    let timeLeft = TIME_PER_QUESTION;
    const timeEl = document.getElementById('time')!;
    timeEl.textContent = String(timeLeft);
    questionStartTime = Date.now();

    timerInterval = window.setInterval(() => {
        timeLeft--;
        timeEl.textContent = String(timeLeft);
        if (timeLeft <= 0) {
            clearTimer();
            recordAnswer(-1, TIME_PER_QUESTION);  // 超时：index=-1
            navigate(1);
        }
    }, 1000);
}

// 记录本题结果到 sessionStorage
function recordAnswer(selectedIndex: number, timeSpent: number) {
    const correct = selectedIndex === qs[current].correctIndex;
    const recs: { correct: boolean; time: number }[] =
        JSON.parse(sessionStorage.getItem('quizResults') || '[]');
    recs.push({ correct, time: timeSpent });
    sessionStorage.setItem('quizResults', JSON.stringify(recs));
}

// 绑定选项高亮
function bindUI() {
    const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.option-btn'));
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

// 渲染与重启倒计时
function renderQuestion() {
    const q = qs[current];
    document.getElementById('prompt')!.textContent = q.prompt;

    const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.option-btn'));
    btns.forEach((btn, i) => {
        btn.textContent = q.options[i] || '';
        btn.disabled = q.options[i] == null;
        btn.classList.remove('selected');
    });

    document.getElementById('counter')!.textContent = `${current+1} / ${qs.length}`;
    document.querySelector<HTMLElement>('.progress')!.style.width =
        `${((current+1)/qs.length)*100}%`;

    startTimer();
}

// 翻页前：先记录本题（如果有点选）再跳
function navigate(delta: number) {
    clearTimer();
    // 记录本题
    const sel = document.querySelector<HTMLButtonElement>('.option-btn.selected');
    const spent = Math.floor((Date.now() - questionStartTime)/1000);
    recordAnswer(sel ? +sel.dataset.index! : -1, Math.min(spent, TIME_PER_QUESTION));

    current += delta;
    if (current >= qs.length) {
        // 完成，跳结果页
        window.location.href = `/result.html`;
        return;
    }
    if (current < 0) current = 0;
    renderQuestion();
}

// 主流程
document.addEventListener('DOMContentLoaded', async () => {
    sessionStorage.removeItem('quizResults');  // 清空旧结果

    const week = getWeek();
    const col = collection(db, 'questions');
    const q = query(col, where('week','==',week), orderBy('id','asc'));
    const snap = await getDocs(q).catch((_: any) => ({ empty:true, docs:[] } as any));

    const all: QuizQuestion[] = snap.empty
        ? []
        : snap.docs.map((d: { data: () => any; }) => {
            const d1 = d.data() as any;
            return {
                id: d1.id,
                prompt: d1.prompt,
                options: d1.options,
                correctIndex: d1.correctIndex
            };
        });

    if (!all.length) {
        document.getElementById('quizContainer')!.innerHTML =
            `<p style="padding:1rem;text-align:center;">empty question here</p>`;
        return;
    }
    qs = all.length > 5 ? shuffleArray(all).slice(0,5) : all;
    bindUI();
    renderQuestion();
    document.getElementById('prevBtn')?.addEventListener('click', () => navigate(-1));
    document.getElementById('nextBtn')?.addEventListener('click', () => navigate(1));
});