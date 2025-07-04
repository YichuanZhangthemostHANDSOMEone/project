// // src/result.ts
//
// import './styles.css';
//
// // —— Firebase Auth 登出 —— //
// import { auth } from '@modules/firebase';
// import { signOut } from 'firebase/auth';
// // —— 结束 —— //
//
// interface RecordItem {
//     correct: boolean;
//     time: number;
// }
//
// document.addEventListener('DOMContentLoaded', () => {
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
//     // —— 2. 从 sessionStorage 取出答题记录 —— //
//     const recs: RecordItem[] = JSON.parse(
//         sessionStorage.getItem('quizResults') || '[]'
//     );
//
//     // —— 3. 计算统计数据 —— //
//     const total      = recs.length;
//     const correctCnt = recs.filter(r => r.correct).length;
//     const totalTime  = recs.reduce((sum, r) => sum + r.time, 0);
//     const accuracy   = total ? Math.round((correctCnt / total) * 100) : 0;
//
//     // —— 4. 更新大百分比 —— //
//     const percentEl = document.getElementById('percent');
//     if (percentEl) percentEl.textContent = `${accuracy}%`;
//
//     // —— 5. 更新环形进度条 —— //
//     const circle = document.querySelector<SVGCircleElement>('.progress');
//     if (circle) {
//         const radius        = circle.r.baseVal.value;
//         const circumference = 2 * Math.PI * radius;
//         circle.style.strokeDasharray  = `${circumference}`;
//         circle.style.strokeDashoffset = `${circumference * (1 - accuracy / 100)}`;
//     }
//
//     // —— 6. 更新“正确数 / 总数” —— //
//     const scoreEl = document.getElementById('score');
//     if (scoreEl) scoreEl.textContent = `${correctCnt} / ${total}`;
//
//     // —— 7. 更新总耗时 —— //
//     const timeEl = document.getElementById('time');
//     if (timeEl) timeEl.textContent = `${totalTime}s`;
//
//     // —— 8. 更新正确率文字 —— //
//     const accEl = document.getElementById('acc');
//     if (accEl) accEl.textContent = `${accuracy}%`;
//
//     // —— 9. 更新建议 —— //
//     const suggEl = document.getElementById('suggestion');
//     if (suggEl) {
//         let text: string;
//         if      (accuracy === 100)       text = 'Excellent! 🎉';
//         else if (accuracy >=  80)       text = 'Great job, keep it up! 👍';
//         else                            text = 'Review the material and try again.';
//         suggEl.textContent = text;
//     }
//
//     // —— 10. Retake Quiz —— //
//     document.getElementById('retakeBtn')?.addEventListener('click', () => {
//         sessionStorage.removeItem('quizResults');
//         // 跳回选周页面
//         window.location.href = '/topics.html';
//     });
//
//     // —— 11. Back to Home —— //
//     document.getElementById('homeBtn')?.addEventListener('click', () => {
//         // 跳回首页
//         window.location.href = '/index.html';
//     });
// });
// src/result.ts
import './styles.css';

import { auth, db } from '@modules/firebase';
import { signOut } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface RecordItem {
    correct: boolean;
    time: number;
}

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

    // —— 2. 从 sessionStorage 取出答题记录 —— //
    const recs: RecordItem[] = JSON.parse(
        sessionStorage.getItem('quizResults') || '[]'
    );

    // —— 3. 计算统计数据 —— //
    const total = recs.length;
    const correctCnt = recs.filter(r => r.correct).length;
    const totalTime = recs.reduce((sum, r) => sum + r.time, 0);
    const accuracy = total ? Math.round((correctCnt / total) * 100) : 0;

    // —— 4. 更新大百分比 —— //
    const percentEl = document.getElementById('percent');
    if (percentEl) percentEl.textContent = `${accuracy}%`;

    // —— 5. 更新环形进度条 —— //
    const circle = document.querySelector<SVGCircleElement>('.progress');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        circle.style.strokeDasharray = `${circumference}`;
        circle.style.strokeDashoffset = `${circumference * (1 - accuracy / 100)}`;
    }

    // —— 6. 更新“正确数 / 总数” —— //
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = `${correctCnt} / ${total}`;

    // —— 7. 更新总耗时 —— //
    const timeEl = document.getElementById('time');
    if (timeEl) timeEl.textContent = `${totalTime}s`;

    // —— 8. 更新建议文字 —— //
    const accEl = document.getElementById('acc');
    if (accEl) {
        let text: string;
        if (accuracy === 100) text = 'Excellent! 🎉';
        else if (accuracy >= 80) text = 'Great job, keep it up! 👍';
        else text = 'Review the material and try again.';
        accEl.textContent = text;
    }

    // —— 9. Retake Quiz —— //
    document.getElementById('retakeBtn')?.addEventListener('click', () => {
        sessionStorage.removeItem('quizResults');
        window.location.href = '/topics.html';
    });

    // —— 10. Back to Home —— //
    document.getElementById('homeBtn')?.addEventListener('click', () => {
        window.location.href = '/index.html';
    });

    // —— 11. 将本次测验记录写入 Firestore —— //
    const user = auth.currentUser;
    if (user) {
        const weekParam = new URLSearchParams(location.search).get('week');
        const week = weekParam ? parseInt(weekParam, 10) : 0;
        try {
            await addDoc(collection(db, 'users', user.uid, 'quizAttempts'), {
                week,
                timestamp: serverTimestamp(),
                total,
                correctCnt,
                totalTime,
                accuracy
            });
        } catch (err: any) {
            console.error('Failed to record quiz attempt:', err);
        }
    }
});