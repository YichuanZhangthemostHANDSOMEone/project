import './styles.css';
import { auth, db } from '@modules/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collectionGroup, getDocs, doc, getDoc } from 'firebase/firestore';
import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement | null;

  // @ts-ignore
  onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      window.location.href = '/login.html';
      return;
    }

    // 登出按钮
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await signOut(auth);
        window.location.href = '/login.html';
      };
    }



    // 权限校验：只有 teacher 可以进
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const role = userDoc.exists() ? (userDoc.data() as any).role : undefined;
    if (role !== 'teacher') {
      window.location.href = '/student_record.html';
      return;
    }

    // 用 collectionGroup 拉出所有 /users/{uid}/quizAttempts
    const snap = await getDocs(collectionGroup(db, 'quizAttempts'));
    const data = snap.docs.map((d: { data: () => any; }) => d.data() as any);

    // 按周统计
    const byWeek: Record<number, any[]> = {};
    data.forEach((rec: { week: string | number; }) => {
      // @ts-ignore
      byWeek[rec.week] ??= [];
      // @ts-ignore
      byWeek[rec.week].push(rec);
    });

    const weeks = Array.from({ length: 10 }, (_, i) => i + 1);
    const avgScore = weeks.map(w => {
      const arr = byWeek[w] || [];
      return arr.length
          ? arr.reduce((s, r) => s + r.correctCnt, 0) / arr.length
          : 0;
    });
    const avgTime = weeks.map(w => {
      const arr = byWeek[w] || [];
      return arr.length
          ? Math.round(arr.reduce((s, r) => s + r.totalTime, 0) / arr.length)
          : 0;
    });

    // 绘图
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