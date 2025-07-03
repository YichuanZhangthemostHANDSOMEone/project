//
// // src/quiz.ts
//
// import { db, auth } from '@modules/firebase';
// import './styles.css';
// import {
//     collection,
//     query,
//     where,
//     getDocs,
//     orderBy
// } from 'firebase/firestore';
// import { signOut } from 'firebase/auth';
//
// // 每题时长（秒）
// const TIME_PER_QUESTION = 40;
// let timerInterval: number | undefined;
// let questionStartTime = 0;
//
// // 测验题目接口
// interface QuizQuestion {
//     id: number;
//     prompt: string;
//     options: string[];
//     correctIndex: number;
// }
//
// // 随机打乱数组
// function shuffleArray<T>(arr: T[]): T[] {
//     const a = arr.slice();
//     for (let i = a.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [a[i], a[j]] = [a[j], a[i]];
//     }
//     return a;
// }
//
// // 从 URL 读取 week 参数
// function getWeek(): number {
//     const wk = parseInt(new URLSearchParams(location.search).get('week') || '', 10);
//     return isNaN(wk) ? 0 : wk;
// }
//
// // 清除倒计时
// function clearTimer() {
//     if (timerInterval !== undefined) {
//         clearInterval(timerInterval);
//         timerInterval = undefined;
//     }
// }
//
// // 启动倒计时
// function startTimer() {
//     clearTimer();
//     let timeLeft = TIME_PER_QUESTION;
//     const timeEl = document.getElementById('time')!;
//     timeEl.textContent = String(timeLeft);
//     questionStartTime = Date.now();
//
//     timerInterval = window.setInterval(() => {
//         timeLeft--;
//         timeEl.textContent = String(timeLeft);
//         if (timeLeft <= 0) {
//             clearTimer();
//             recordAnswer(-1, TIME_PER_QUESTION); // 超时记录
//             navigate(1);
//         }
//     }, 1000);
// }
//
// // 记录答案到 sessionStorage
// function recordAnswer(selectedIndex: number, timeSpent: number) {
//     const correct = selectedIndex === qs[current].correctIndex;
//     const recs: { correct: boolean; time: number }[] =
//         JSON.parse(sessionStorage.getItem('quizResults') || '[]');
//     recs.push({ correct, time: timeSpent });
//     sessionStorage.setItem('quizResults', JSON.stringify(recs));
// }
//
// // 绑定选项高亮
// function bindUI() {
//     const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.option-btn'));
//     btns.forEach(btn => {
//         btn.addEventListener('click', () => {
//             btns.forEach(b => b.classList.remove('selected'));
//             btn.classList.add('selected');
//         });
//     });
// }
//
// // 渲染当前题目并开启倒计时
// function renderQuestion() {
//     const q = qs[current];
//     document.getElementById('prompt')!.textContent = q.prompt;
//
//     const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.option-btn'));
//     btns.forEach((btn, i) => {
//         btn.textContent = q.options[i] || '';
//         btn.disabled = q.options[i] == null;
//         btn.classList.remove('selected');
//     });
//
//     document.getElementById('counter')!.textContent = `${current + 1} / ${qs.length}`;
//     document.querySelector<HTMLElement>('.progress')!.style.width =
//         `${((current + 1) / qs.length) * 100}%`;
//
//     startTimer();
// }
//
// // 翻页：记录本题再跳转
// function navigate(delta: number) {
//     clearTimer();
//     const sel = document.querySelector<HTMLButtonElement>('.option-btn.selected');
//     const spent = Math.floor((Date.now() - questionStartTime) / 1000);
//     recordAnswer(sel ? +sel.dataset.index! : -1, Math.min(spent, TIME_PER_QUESTION));
//
//     current += delta;
//     if (current >= qs.length) {
//         // 跳转到结果页
//         window.location.href = '/result.html';
//         return;
//     }
//     if (current < 0) current = 0;
//     renderQuestion();
// }
//
// let current = 0;
// let qs: QuizQuestion[] = [];
//
// document.addEventListener('DOMContentLoaded', async () => {
//     // —— 1. Logout 按钮 —— //
//     const authBtn = document.getElementById('authBtn');
//     authBtn?.addEventListener('click', async () => {
//         try {
//             await signOut(auth);
//             sessionStorage.removeItem('quizResults');
//             window.location.href = '/login.html';
//         } catch (err: any) {
//             console.error('Logout failed:', err);
//             alert('Logout failed: ' + err.message);
//         }
//     });
//
//     // —— 2. 清空旧结果 —— //
//     sessionStorage.removeItem('quizResults');
//
//     // —— 3. 加载 Firestore 题目 —— //
//     const week = getWeek();
//     try {
//         const snap = await getDocs(
//             query(
//                 collection(db, 'questions'),
//                 where('week', '==', week),
//                 orderBy('id', 'asc')
//             )
//         );
//         const all: QuizQuestion[] = snap.docs.map((d: { data: () => any; }) => {
//             const data = d.data() as any;
//             return {
//                 id:           data.id,
//                 prompt:       data.prompt,
//                 options:      data.options,
//                 correctIndex: data.correctIndex
//             };
//         });
//
//         if (all.length === 0) {
//             document.getElementById('quizContainer')!.innerHTML =
//                 `<p style="padding:1rem; text-align:center;">No questions found for week ${week}</p>`;
//             return;
//         }
//
//         // 随机抽取至多 5 道
//         qs = all.length > 5 ? shuffleArray(all).slice(0, 5) : all;
//         bindUI();
//         renderQuestion();
//
//         document.getElementById('prevBtn')?.addEventListener('click', () => navigate(-1));
//         document.getElementById('nextBtn')?.addEventListener('click', () => navigate(1));
//
//     } catch (err) {
//         console.error('加载题目出错：', err);
//         document.getElementById('quizContainer')!.innerHTML =
//             `<p style="padding:1rem; text-align:center;">加载题目失败，请稍后重试。</p>`;
//     }
// });

import { db, auth } from '@modules/firebase';
import './styles.css';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// 每题时长（秒）
const TIME_PER_QUESTION = 40;
let timerInterval: number | undefined;
let questionStartTime = 0;

// 测验题目接口
interface QuizQuestion {
    id: number;
    prompt: string;
    options: string[];
    correctIndex: number;
}

// 随机打乱数组
function shuffleArray<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// 从 URL 读取 week 参数
function getWeek(): number {
    const wk = parseInt(new URLSearchParams(location.search).get('week') || '', 10);
    return isNaN(wk) ? 0 : wk;
}

// 清除倒计时
function clearTimer() {
    if (timerInterval !== undefined) {
        clearInterval(timerInterval);
        timerInterval = undefined;
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
            recordAnswer(-1, TIME_PER_QUESTION); // 超时记录
            navigate(1);
        }
    }, 1000);
}

// 记录答案到 sessionStorage
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

// 渲染当前题目并开启倒计时
function renderQuestion() {
    const q = qs[current];
    document.getElementById('prompt')!.textContent = q.prompt;

    const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.option-btn'));
    btns.forEach((btn, i) => {
        btn.textContent = q.options[i] || '';
        btn.disabled = q.options[i] == null;
        btn.classList.remove('selected');
    });

    document.getElementById('counter')!.textContent = `${current + 1} / ${qs.length}`;
    document.querySelector<HTMLElement>('.progress')!.style.width =
        `${((current + 1) / qs.length) * 100}%`;

    startTimer();
}

// 翻页：记录本题再跳转；如果答完了，就写 Firestore 再跳结果
async function navigate(delta: number) {
    clearTimer();
    const sel = document.querySelector<HTMLButtonElement>('.option-btn.selected');
    const spent = Math.floor((Date.now() - questionStartTime) / 1000);
    recordAnswer(sel ? +sel.dataset.index! : -1, Math.min(spent, TIME_PER_QUESTION));

    current += delta;
    if (current >= qs.length) {
        // —— 把整场测验结果写入 Firestore —— //
        try {
            const user = auth.currentUser;
            if (user) {
                const results: { correct: boolean; time: number }[] =
                    JSON.parse(sessionStorage.getItem('quizResults') || '[]');
                const correctCnt = results.filter(r => r.correct).length;
                const accuracy = results.length ? correctCnt / results.length : 0;
                await addDoc(
                    collection(db, 'users', user.uid, 'quizAttempts'),
                    {
                        week: getWeek(),
                        correctCnt,
                        accuracy,
                        timestamp: serverTimestamp()
                    }
                );
            }
        } catch (err) {
            console.error('保存测验记录失败：', err);
        }

        // 跳结果页
        window.location.href = '/result.html';
        return;
    }

    if (current < 0) current = 0;
    renderQuestion();
}

let current = 0;
let qs: QuizQuestion[] = [];

document.addEventListener('DOMContentLoaded', async () => {
    // —— 1. Logout 按钮 —— //
    const authBtn = document.getElementById('authBtn');
    authBtn?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            sessionStorage.removeItem('quizResults');
            window.location.href = '/login.html';
        } catch (err: any) {
            console.error('Logout failed:', err);
            alert('Logout failed: ' + err.message);
        }
    });

    // —— 2. 清空旧结果 —— //
    sessionStorage.removeItem('quizResults');

    // —— 3. 加载 Firestore 题目 —— //
    const week = getWeek();
    try {
        const snap = await getDocs(
            query(
                collection(db, 'questions'),
                where('week', '==', week),
                orderBy('id', 'asc')
            )
        );
        const all: QuizQuestion[] = snap.docs.map((d: { data: () => any; }) => {
            const data = d.data() as any;
            return {
                id: data.id,
                prompt: data.prompt,
                options: data.options,
                correctIndex: data.correctIndex
            };
        });

        if (all.length === 0) {
            document.getElementById('quizContainer')!.innerHTML =
                `<p style="padding:1rem; text-align:center;">No questions found for week ${week}</p>`;
            return;
        }

        qs = all.length > 5 ? shuffleArray(all).slice(0, 5) : all;
        bindUI();
        renderQuestion();

        document.getElementById('prevBtn')?.addEventListener('click', () => navigate(-1));
        document.getElementById('nextBtn')?.addEventListener('click', () => navigate(1));
    } catch (err) {
        console.error('加载题目出错：', err);
        document.getElementById('quizContainer')!.innerHTML =
            `<p style="padding:1rem; text-align:center;">加载题目失败，请稍后重试。</p>`;
    }
});