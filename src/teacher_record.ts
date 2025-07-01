import './styles.css';
import { auth, db } from '@modules/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collectionGroup, getDocs } from 'firebase/firestore';
// @ts-ignore
import Chart from 'chart.js/auto';

const TEACHER_EMAIL = 'steve.kerrison@jcu.edu.au';

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement | null;

  // @ts-ignore
  onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) return (window.location.href = '/login.html');

    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await signOut(auth);
        window.location.href = '/login.html';
      };
    }

    if (user.email !== TEACHER_EMAIL) {
      window.location.href = '/student_record.html';
      return;
    }

    // 获取所有学生的测验记录
    const snap = await getDocs(collectionGroup(db, 'quizAttempts'));
    const data = snap.docs.map((d: any) => d.data() as any);

    const byWeek: Record<number, any[]> = {};
    data.forEach((rec: any) => {
      byWeek[rec.week] ??= [];
      byWeek[rec.week].push(rec);
    });

    const weeks = Array.from({ length: 10 }, (_, i) => i + 1);
    const avgScore = weeks.map(w => {
      const arr = byWeek[w] || [];
      return arr.length ? arr.reduce((s, r) => s + r.correctCnt, 0) / arr.length : 0;
    });
    const avgTime = weeks.map(w => {
      const arr = byWeek[w] || [];
      return arr.length ? Math.round(arr.reduce((s, r) => s + r.totalTime, 0) / arr.length) : 0;
    });

    new Chart(
      document.getElementById('scoreChart') as HTMLCanvasElement,
      { type: 'bar', data: { labels: weeks.map(String), datasets: [{ label: '平均得分', data: avgScore }] } }
    );
    new Chart(
      document.getElementById('timeChart') as HTMLCanvasElement,
      { type: 'bar', data: { labels: weeks.map(String), datasets: [{ label: '平均耗时(s)', data: avgTime }] } }
    );
  });
});
