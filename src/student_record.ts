import './styles.css';
import { auth, db } from '@modules/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
// @ts-ignore
import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;

    // @ts-ignore
    onAuthStateChanged(auth, async (user: User | null) => {
        if (!user) return window.location.href = '/login.html';

        logoutBtn.onclick = async () => {
            await signOut(auth);
            window.location.href = '/login.html';
        };

        // 获取所有测验记录
        const snap = await getDocs(collection(db, 'users', user.uid, 'quizAttempts'));
        const data = snap.docs.map((d: { data: () => any; }) => d.data() as any);

        // 按周分组
        const byWeek: Record<number, any[]> = {};
        data.forEach((rec: { week: string | number; }) => {
            // @ts-ignore
            byWeek[rec.week] ??= [];
            // @ts-ignore
            byWeek[rec.week].push(rec);
        });

        const weeks = Array.from({ length: 10 }, (_, i) => i + 1);
        const avgScores = weeks.map(w => {
            const arr = byWeek[w] || [];
            return arr.length ? arr.reduce((sum, r) => sum + r.correctCnt, 0) / arr.length : 0;
        });
        const avgAcc = weeks.map(w => {
            const arr = byWeek[w] || [];
            return arr.length ? arr.reduce((sum, r) => sum + r.accuracy, 0) / arr.length : 0;
        });
        const attemptCounts = weeks.map(w => (byWeek[w] || []).length);

        // 绘制柱状图：平均得分
        new Chart(
            document.getElementById('weeklyBarChart') as HTMLCanvasElement,
            { type: 'bar', data: { labels: weeks.map(String), datasets: [{ label: '平均得分', data: avgScores }] } }
        );
        // 绘制折线图：平均准确率
        new Chart(
            document.getElementById('accuracyLineChart') as HTMLCanvasElement,
            { type: 'line', data: { labels: weeks.map(String), datasets: [{ label: '平均准确率', data: avgAcc }] } }
        );
        // 绘制饼图：尝试次数分布
        new Chart(
            document.getElementById('timePieChart') as HTMLCanvasElement,
            { type: 'pie', data: { labels: weeks.map(String), datasets: [{ label: '尝试次数', data: attemptCounts }] } }
        );
    });
});