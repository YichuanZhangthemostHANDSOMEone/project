// src/quiz.ts
import { db, auth } from '@modules/firebase';
import './styles.css';
import {
    collection, query, where, getDocs, orderBy, addDoc, serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { goTo } from './utils/navigation';

export interface QuizQuestion {
    id: number;
    prompt: string;
    options: string[];
    correctIndex: number;
}

interface QuizDeps {
    db: any;
    auth: any;
    getDocs: typeof getDocs;
    query: typeof query;
    collection: typeof collection;
    where: typeof where;
    orderBy: typeof orderBy;
    addDoc: typeof addDoc;
    serverTimestamp: typeof serverTimestamp;
    onAuthStateChanged: typeof onAuthStateChanged;
    signOut: typeof signOut;
    storage: Storage;
    navigation: { goTo(url: string): void; setLocation(url: string): void; };
    setInterval: typeof setInterval;
    clearInterval: typeof clearInterval;
    Date: typeof Date;
    document: Document;
}

export class QuizApp {
    TIME_PER_QUESTION = 40;
    timerInterval?: number;
    questionStartTime = 0;
    current = 0;
    qs: QuizQuestion[] = [];

    deps: QuizDeps;

    constructor(deps: Partial<QuizDeps> = {}) {
        // 默认用真实实现
        this.deps = {
            db,
            auth,
            getDocs,
            query,
            collection,
            where,
            orderBy,
            addDoc,
            serverTimestamp,
            onAuthStateChanged,
            signOut,
            storage: window.sessionStorage,
            navigation: {
                goTo: goTo,
                setLocation: (url: string) => { window.location.href = url; }
            },
            setInterval: window.setInterval.bind(window),
            clearInterval: window.clearInterval.bind(window),
            Date,
            document: window.document,
            ...deps
        };
    }

    shuffleArray<T>(arr: T[]): T[] {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    getWeek(): number {
        const wk = parseInt(new URLSearchParams(window.location.search).get('week') || '', 10);
        return isNaN(wk) ? 0 : wk;
    }

    clearTimer() {
        if (this.timerInterval !== undefined) {
            this.deps.clearInterval(this.timerInterval);
            this.timerInterval = undefined;
        }
    }

    startTimer() {
        this.clearTimer();
        let timeLeft = this.TIME_PER_QUESTION;
        const timeEl = this.deps.document.getElementById('time')!;
        timeEl.textContent = String(timeLeft);
        this.questionStartTime = this.deps.Date.now();

        // @ts-ignore
        this.timerInterval = this.deps.setInterval(() => {
            timeLeft--;
            timeEl.textContent = String(timeLeft);
            if (timeLeft <= 0) {
                this.clearTimer();
                this.recordAnswer(-1, this.TIME_PER_QUESTION);
                this.navigate(1);
            }
        }, 1000);
    }

    recordAnswer(selectedIndex: number, timeSpent: number) {
        const correct = selectedIndex === this.qs[this.current].correctIndex;
        const recs: { correct: boolean; time: number }[] =
            JSON.parse(this.deps.storage.getItem('quizResults') || '[]');
        recs.push({ correct, time: timeSpent });
        this.deps.storage.setItem('quizResults', JSON.stringify(recs));
    }

    bindUI() {
        const btns = Array.from(this.deps.document.querySelectorAll<HTMLButtonElement>('.option-btn'));
        btns.forEach((btn, i) => {
            btn.dataset.index = String(i);
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    renderQuestion() {
        const q = this.qs[this.current];
        this.deps.document.getElementById('prompt')!.textContent = q.prompt;

        const btns = Array.from(this.deps.document.querySelectorAll<HTMLButtonElement>('.option-btn'));
        btns.forEach((btn, i) => {
            btn.textContent = q.options[i] || '';
            btn.disabled = q.options[i] == null;
            btn.classList.remove('selected');
        });

        this.deps.document.getElementById('counter')!.textContent = `${this.current + 1} / ${this.qs.length}`;
        this.deps.document.querySelector<HTMLElement>('.progress')!.style.width =
            `${((this.current + 1) / this.qs.length) * 100}%`;

        this.startTimer();
    }

    // 翻页 & 最后一题提交
    async navigate(delta: number) {
        this.clearTimer();
        const sel = this.deps.document.querySelector<HTMLButtonElement>('.option-btn.selected');
        const spent = Math.floor((this.deps.Date.now() - this.questionStartTime) / 1000);
        this.recordAnswer(sel ? +sel.dataset.index! : -1, Math.min(spent, this.TIME_PER_QUESTION));

        this.current += delta;
        if (this.current >= this.qs.length) {
            // 提交
            try {
                const user = this.deps.auth.currentUser;
                if (user) {
                    const results: { correct: boolean; time: number }[] =
                        JSON.parse(this.deps.storage.getItem('quizResults') || '[]');
                    const correctCnt = results.filter(r => r.correct).length;
                    const accuracy = results.length ? correctCnt / results.length : 0;
                    const totalTime = results.reduce((sum, r) => sum + r.time, 0);

                    await this.deps.addDoc(
                        this.deps.collection(this.deps.db, 'users', user.uid, 'quizAttempts'),
                        {
                            week: this.getWeek(),
                            correctCnt,
                            accuracy,
                            totalTime,
                            timestamp: this.deps.serverTimestamp()
                        }
                    );
                }
            } catch (err) {
                console.error('Failed to save the test record：', err);
            }
            this.deps.navigation.setLocation('/result.html');
            return;
        }

        if (this.current < 0) this.current = 0;
        this.renderQuestion();
    }

    async init() {
        // 登出按钮
        const authBtn = this.deps.document.getElementById('authBtn');
        authBtn?.addEventListener('click', async () => {
            await this.deps.signOut(this.deps.auth);
            this.deps.storage.removeItem('quizResults');
            this.deps.navigation.setLocation('/login.html');
        });

        // 只有登录后才渲染题目
        this.deps.onAuthStateChanged(this.deps.auth, async (user: any) => {
            if (!user) {
                this.deps.navigation.setLocation('/login.html');
                return;
            }
            this.deps.storage.removeItem('quizResults');
            const week = this.getWeek();
            try {
                const snap = await this.deps.getDocs(
                    this.deps.query(
                        this.deps.collection(this.deps.db, 'questions'),
                        this.deps.where('week', '==', week),
                        this.deps.orderBy('id', 'asc')
                    )
                );
                const all = snap.docs.map((d: { data: () => any; }) => {
                    const data = d.data() as any;
                    return {
                        id: data.id,
                        prompt: data.prompt,
                        options: data.options,
                        correctIndex: data.correctIndex
                    } as QuizQuestion;
                });

                if (all.length === 0) {
                    this.deps.document.getElementById('quizContainer')!.innerHTML =
                        `<p style="padding:1rem; text-align:center;">Week ${week} 没有题目</p>`;
                    return;
                }

                this.qs = all.length > 5 ? this.shuffleArray(all).slice(0, 5) : all;
                this.bindUI();
                this.renderQuestion();

                // 上一题 / 下一题
                this.deps.document.getElementById('prevBtn')?.addEventListener('click', () => this.navigate(-1));
                this.deps.document.getElementById('nextBtn')?.addEventListener('click', () => this.navigate(1));
            } catch (err) {
                console.error('loading question failed：', err);
                this.deps.document.getElementById('quizContainer')!.innerHTML =
                    `<p style="padding:1rem; text-align:center; color:red;">
                    Loading the question failed. Please check your network connection or permission settings.
                    </p>`;
            }
        });
    }
}

// 页面初始化
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new QuizApp();
        app.init();
    });
}