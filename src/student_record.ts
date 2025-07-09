// import './styles.css';
// import { auth, db } from '@modules/firebase';
// import { onAuthStateChanged, signOut, User } from 'firebase/auth';
// import { collection, getDocs } from 'firebase/firestore';
// // @ts-ignore
// import Chart from 'chart.js/auto';
//
// document.addEventListener('DOMContentLoaded', () => {
//     const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
//
//     // @ts-ignore
//     onAuthStateChanged(auth, async (user: User | null) => {
//         if (!user) return window.location.href = '/login.html';
//
//         logoutBtn.onclick = async () => {
//             await signOut(auth);
//             window.location.href = '/login.html';
//         };
//
//         // 获取所有测验记录
//         const snap = await getDocs(collection(db, 'users', user.uid, 'quizAttempts'));
//         const data = snap.docs.map((d: { data: () => any; }) => d.data() as any);
//
//         // 按周分组
//         const byWeek: Record<number, any[]> = {};
//         data.forEach((rec: { week: string | number; }) => {
//             // @ts-ignore
//             byWeek[rec.week] ??= [];
//             // @ts-ignore
//             byWeek[rec.week].push(rec);
//         });
//
//         const weeks = Array.from({ length: 10 }, (_, i) => i + 1);
//         const avgScores = weeks.map(w => {
//             const arr = byWeek[w] || [];
//             return arr.length ? arr.reduce((sum, r) => sum + r.correctCnt, 0) / arr.length : 0;
//         });
//         const avgAcc = weeks.map(w => {
//             const arr = byWeek[w] || [];
//             return arr.length ? arr.reduce((sum, r) => sum + r.accuracy, 0) / arr.length : 0;
//         });
//         const attemptCounts = weeks.map(w => (byWeek[w] || []).length);
//
//         // 绘制柱状图：平均得分
//         new Chart(
//             document.getElementById('weeklyBarChart') as HTMLCanvasElement,
//             { type: 'bar', data: { labels: weeks.map(String), datasets: [{ label: '平均得分', data: avgScores }] } }
//         );
//         // 绘制折线图：平均准确率
//         new Chart(
//             document.getElementById('accuracyLineChart') as HTMLCanvasElement,
//             { type: 'line', data: { labels: weeks.map(String), datasets: [{ label: '平均准确率', data: avgAcc }] } }
//         );
//         // 绘制饼图：尝试次数分布
//         new Chart(
//             document.getElementById('timePieChart') as HTMLCanvasElement,
//             { type: 'pie', data: { labels: weeks.map(String), datasets: [{ label: '尝试次数', data: attemptCounts }] } }
//         );
//     });
// });

import './styles.css';
import { auth, db } from '@modules/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
// @ts-ignore
import Chart from 'chart.js/auto';

// 类型定义
type Metric = 'score' | 'accuracy' | 'time';
type AggMetric = 'attempts' | 'accuracy' | 'time';

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;

    // @ts-ignore
    onAuthStateChanged(auth, async (user: User | null) => {
        if (!user) return window.location.href = '/login.html';

        logoutBtn.onclick = async () => {
            await signOut(auth);
            window.location.href = '/login.html';
        };

        // 拉取 Firestore 中 quizAttempts 文档
        const snap = await getDocs(collection(db, 'users', user.uid, 'quizAttempts'));
        const data = snap.docs.map((d: { data: () => any; }) => d.data() as any);

        // 按周分组
        const byWeek: Record<number, any[]> = {};
        data.forEach((rec: { week: any; }) => {
            const w = Number(rec.week);
            byWeek[w] ??= [];
            byWeek[w].push(rec);
        });

        const weeks = Array.from({ length: 10 }, (_, i) => i + 1);
        const attemptCounts = weeks.map(w => (byWeek[w] || []).length);
        const avgAcc = weeks.map(w => {
            const arr = byWeek[w] || [];
            return arr.length ? arr.reduce((sum, r) => sum + r.accuracy, 0) / arr.length : 0;
        });
        const avgTime = weeks.map(w => {
            const arr = byWeek[w] || [];
            return arr.length ? arr.reduce((sum, r) => sum + r.time, 0) / arr.length : 0;
        });

        // DOM 元素
        const weekTabs = document.getElementById('weekTabs')!;
        const pieMetricSelect = document.getElementById('pieMetricSelect') as HTMLSelectElement;
        const weekMetricSelect = document.getElementById('weekMetricSelect') as HTMLSelectElement;
        const aggregateMetricSelect = document.getElementById('aggregateMetricSelect') as HTMLSelectElement;

        // 初始化周标签
        weeks.forEach((w, idx) => {
            const btn = document.createElement('button');
            btn.textContent = `Week ${w}`;
            btn.classList.add('week-tab');
            btn.dataset.week = String(w);
            if (idx === 0) btn.classList.add('active');
            weekTabs.appendChild(btn);
        });

        let selectedWeek = weeks[0];

        weekTabs.addEventListener('click', e => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('week-tab')) return;
            document.querySelectorAll('.week-tab').forEach(b => b.classList.remove('active'));
            target.classList.add('active');
            selectedWeek = Number(target.dataset.week);
            renderWeekLineChart(weekMetricSelect.value as Metric);
        });

        // 图表实例
        let pieChart: Chart, weekLineChart: Chart, aggregatedBarChart: Chart;

        // 渲染饼图
        function renderPieChart() {
            const dataCounts = weeks.map(w => byWeek[w]?.length || 0);
            if (pieChart) pieChart.destroy();
            pieChart = new Chart(
                document.getElementById('weeklyPieChart') as HTMLCanvasElement,
                {
                    type: 'pie',
                    data: { labels: weeks.map(String), datasets: [{ data: dataCounts }] }
                }
            );
        }

        // 渲染单周折线图
        function renderWeekLineChart(metric: Metric) {
            const arr = byWeek[selectedWeek] || [];
            const labels = arr.map((_, i) => `尝试${i + 1}`);
            const dataValues = arr.map(r => {
                if (metric === 'score') return r.correctCnt;
                if (metric === 'accuracy') return r.accuracy;
                return r.time;
            });
            if (weekLineChart) weekLineChart.destroy();
            weekLineChart = new Chart(
                document.getElementById('weekLineChart') as HTMLCanvasElement,
                {
                    type: 'line',
                    data: { labels, datasets: [{ data: dataValues }] }
                }
            );
        }

        // 渲染聚合柱状图
        function renderAggregatedBarChart(metric: AggMetric) {
            const dataValues = metric === 'attempts'
                ? attemptCounts
                : metric === 'accuracy'
                    ? avgAcc
                    : avgTime;
            if (aggregatedBarChart) aggregatedBarChart.destroy();
            aggregatedBarChart = new Chart(
                document.getElementById('aggregatedBarChart') as HTMLCanvasElement,
                {
                    type: 'bar',
                    data: { labels: weeks.map(String), datasets: [{ data: dataValues }] }
                }
            );
        }

        // 事件监听
        pieMetricSelect.addEventListener('change', renderPieChart);
        weekMetricSelect.addEventListener('change', () => renderWeekLineChart(weekMetricSelect.value as Metric));
        aggregateMetricSelect.addEventListener('change', () => renderAggregatedBarChart(aggregateMetricSelect.value as AggMetric));

        // 初始化所有图表
        renderPieChart();
        renderWeekLineChart(weekMetricSelect.value as Metric);
        renderAggregatedBarChart(aggregateMetricSelect.value as AggMetric);
        renderCalendar();

        // 日历渲染
        function renderCalendar() {
            const cal = document.getElementById('calendar')!;
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let html = '<table class="calendar-table"><thead><tr>';
            ['日', '一', '二', '三', '四', '五', '六'].forEach(d => html += `<th>${d}</th>`);
            html += '</tr></thead><tbody><tr>';

            for (let i = 0; i < firstDay; i++) html += '<td></td>';
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, month, d);
                const isToday = date.toDateString() === now.toDateString();
                html += `<td class="${isToday ? 'today' : ''}">${d}</td>`;
                if ((firstDay + d) % 7 === 0) html += '</tr><tr>';
            }
            html += '</tr></tbody></table>';
            cal.innerHTML = html;
        }
    });
});