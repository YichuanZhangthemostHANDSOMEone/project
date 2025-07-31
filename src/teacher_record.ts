// // src/teacher_record.ts
// import './styles.css'
// import Chart from 'chart.js/auto'
// import annotationPlugin from 'chartjs-plugin-annotation'
// import { auth, db } from '@modules/firebase'
// import { onAuthStateChanged, signOut, User } from 'firebase/auth'
// import {
//   collectionGroup,
//   getDocs,
//   query,
//   where,
//   collection,
//   DocumentData
// } from 'firebase/firestore'
//
// Chart.register(annotationPlugin)
//
// interface Quiz {
//   week: number
//   date: string
//   correctCnt: number
//   accuracy: number   // 百分比
//   totalTime: number  // 秒
// }
// interface Attempt extends Quiz { uid: string }
//
// // 图表实例句柄
// let accuracyChart:  Chart<'line', number[], string> | null = null
// let timeChart:      Chart<'bar',  number[], string> | null = null
// let efficiencyChart: Chart<'line'|'bar', any, string> | null = null
//
// document.addEventListener('DOMContentLoaded', () => {
//   // DOM 元素
//   const logoutBtn       = document.getElementById('logoutBtn')      as HTMLElement
//   const weekSel         = document.getElementById('weekSelector')   as HTMLSelectElement
//   const nameEl          = document.getElementById('studentName')    as HTMLElement
//   const classEl         = document.getElementById('studentClass')   as HTMLElement
//   const avgEl           = document.getElementById('avgAccuracy')    as HTMLElement
//   const trendEl         = document.getElementById('accuracyTrend')  as HTMLElement
//   const totalEl         = document.getElementById('totalAttempts')  as HTMLElement
//   const progressEl      = document.getElementById('weeklyProgress') as HTMLElement
//   const calendarTbl     = document.getElementById('calendarTable')  as HTMLTableElement
//   const activityHead    = document.getElementById('activityHead')   as HTMLTableSectionElement
//   const activityBody    = document.getElementById('activityBody')   as HTMLTableSectionElement
//   const leaderboardBody = document.getElementById('leaderboardBody') as HTMLTableSectionElement
//
//   // 状态
//   let questionWeeks:   number[]              = []
//   let allAttempts:     Attempt[]             = []
//   let userMap:         Record<string,string> = {}
//   let studentUid       = ''
//   let studentQuizzes:  Quiz[]                = []
//   let filteredQuizzes: Quiz[]                = []
//
//   const average = (arr: number[]) =>
//       arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
//
//   // 切换周次
//   weekSel.addEventListener('change', () => {
//     filteredQuizzes = weekSel.value === 'all'
//         ? studentQuizzes
//         : studentQuizzes.filter(q => q.week === +weekSel.value)
//     initOverview()
//     renderCharts()
//     renderActivity()
//     renderLeaderboard()
//   })
//
//   // 初始化数据
//   async function initData(email: string) {
//     // 1. 获取题库所有周次，注意 Set<number>
//     const qSnap = await getDocs(collection(db, 'questions'))
//     questionWeeks = Array.from(
//         new Set<number>(
//             qSnap.docs.map((d: { data: () => any }) => Number((d.data() as any).week))
//         )
//     ).sort((a, b) => a - b)
//
//     // 2. 构建用户 ID→姓名 映射
//     const uSnap = await getDocs(collection(db, 'users'))
//     uSnap.forEach((d: { data: () => any; id: string | number }) => {
//       const u = d.data() as any
//       userMap[d.id] = u.name ?? u.email ?? 'Unknown'
//     })
//
//     // 3. 拉取所有用户的测验记录
//     const allSnap = await getDocs(collectionGroup(db, 'quizAttempts'))
//     allAttempts = allSnap.docs.map((d: { data: () => any; ref: { parent: { parent: { id: string } } } }) => {
//       const data = d.data() as any
//       const uid  = d.ref.parent.parent?.id || ''
//       return {
//         uid,
//         week:      Number(data.week) || 0,
//         date:      data.timestamp?.toDate?.().toLocaleDateString() || '',
//         correctCnt:Number(data.correctCnt) || 0,
//         totalTime: Number(data.totalTime)  || 0,
//         accuracy:  typeof data.accuracy === 'number'
//             ? data.accuracy * 100
//             : data.totalCnt
//                 ? (Number(data.correctCnt) / Number(data.totalCnt)) * 100
//                 : 0
//       }
//     })
//
//     // 4. 定位当前学生
//     const userSnap = await getDocs(
//         query(collection(db, 'users'), where('email', '==', email))
//     )
//     if (userSnap.empty) {
//       alert(`未找到学生邮箱：${email}`)
//       location.href = 'teacher_list.html'
//       return
//     }
//     const stud = userSnap.docs[0]
//     studentUid  = stud.id
//     // @ts-ignore
//     const sData  = stud.data() as DocumentData
//     nameEl.textContent  = sData.name  ?? email
//     classEl.textContent = sData.class ?? '—'
//
//     // 5. 拉取该学生测验记录
//     const aSnap = await getDocs(collection(db, 'users', studentUid, 'quizAttempts'))
//     studentQuizzes = aSnap.docs.map((d: { data: () => any }) => {
//       const data = d.data() as any
//       return {
//         week:      Number(data.week) || 0,
//         date:      data.timestamp?.toDate?.().toLocaleDateString() || '',
//         correctCnt:Number(data.correctCnt) || 0,
//         totalTime: Number(data.totalTime)  || 0,
//         accuracy:  typeof data.accuracy === 'number'
//             ? data.accuracy * 100
//             : data.totalCnt
//                 ? (Number(data.correctCnt) / Number(data.totalCnt)) * 100
//                 : 0
//       }
//     })
//
//     filteredQuizzes = [...studentQuizzes]
//
//     // 一次性渲染所有模块
//     populateWeeks()
//     initCalendar()
//     initOverview()
//     renderCharts()
//     renderActivity()
//     renderLeaderboard()
//   }
//
//   // 填充周次下拉
//   function populateWeeks() {
//     weekSel.innerHTML = '<option value="all">All Weeks</option>'
//     questionWeeks.forEach(w => {
//       const o = document.createElement('option')
//       o.value = String(w)
//       o.textContent = 'Week ' + w
//       weekSel.appendChild(o)
//     })
//   }
//
//   // 渲染日历
//   function initCalendar() {
//     const now   = new Date()
//     const Y     = now.getFullYear()
//     const M     = now.getMonth()
//     const first = new Date(Y, M, 1).getDay()
//     const dim   = new Date(Y, M + 1, 0).getDate()
//
//     let html = '<thead><tr>' +
//         ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
//             .map(d => `<th>${d}</th>`).join('') +
//         '</tr></thead><tbody><tr>'
//
//     for (let i = 0; i < first; i++) html += '<td></td>'
//     for (let d = 1; d <= dim; d++) {
//       const cls = d === now.getDate() ? ' class="today"' : ''
//       html += `<td${cls}>${d}</td>`
//       if ((first + d) % 7 === 0 && d < dim) html += '</tr><tr>'
//     }
//
//     html += '</tr></tbody>'
//     calendarTbl.innerHTML = html
//   }
//
//   // 渲染概览
//   function initOverview() {
//     if (!filteredQuizzes.length) {
//       avgEl.textContent      = totalEl.textContent      = '0'
//       trendEl.textContent    = progressEl.textContent   = '0%'
//       return
//     }
//     avgEl.textContent   = average(filteredQuizzes.map(q => q.accuracy)).toFixed(1) + '%'
//     totalEl.textContent = String(filteredQuizzes.length)
//
//     const weeks = Array.from(new Set(filteredQuizzes.map(q => q.week))).sort((a, b) => a - b)
//     const last  = weeks.at(-1)!
//     const prev  = weeks.length > 1 ? weeks.at(-2)! : last
//     const diff  = average(filteredQuizzes.filter(q => q.week === last).map(q => q.accuracy))
//         - average(filteredQuizzes.filter(q => q.week === prev).map(q => q.accuracy))
//     const txt   = (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%'
//
//     trendEl.textContent    = txt
//     trendEl.className      = 'trend ' + (diff >= 0 ? 'up' : 'down')
//     progressEl.textContent = txt
//   }
//
//   // 渲染图表
//   function renderCharts() {
//     accuracyChart?.destroy()
//     timeChart?.destroy()
//     efficiencyChart?.destroy()
//
//     const labels = questionWeeks.map(w => 'W' + w)
//     const acc    = questionWeeks.map(w =>
//         average(filteredQuizzes.filter(q => q.week === w).map(q => q.accuracy))
//     )
//     const time   = questionWeeks.map(w =>
//         average(filteredQuizzes.filter(q => q.week === w).map(q => q.totalTime))
//     )
//
//     accuracyChart = new Chart(
//         document.getElementById('accuracyChart') as HTMLCanvasElement,
//         {
//           type: 'line',
//           data: { labels, datasets: [{ label: '准确率 (%)', data: acc, tension: 0.3 }] },
//           options: { scales: { y: { beginAtZero: true, max: 100 } } }
//         }
//     )
//
//     timeChart = new Chart(
//         document.getElementById('timeChart') as HTMLCanvasElement,
//         {
//           type: 'bar',
//           data: { labels, datasets: [{ label: '平均用时 (s)', data: time, backgroundColor: '#c7d2fe' }] },
//           options: { scales: { y: { beginAtZero: true } } }
//         }
//     )
//
//     efficiencyChart = new Chart(
//         document.getElementById('efficiencyChart') as HTMLCanvasElement,
//         {
//           data: {
//             labels,
//             datasets: [
//               { type: 'line', label: '准确率 (%)', yAxisID: 'y1', data: acc },
//               { type: 'line', label: '用时 (s)',   yAxisID: 'y2', data: time }
//             ]
//           },
//           options: {
//             scales: {
//               y1: { position: 'left',  beginAtZero: true, max: 100 },
//               y2: { position: 'right', beginAtZero: true }
//             }
//           }
//         }
//     )
//   }
//
//   // 渲染活跃度表
//   function renderActivity() {
//     activityHead.innerHTML = '<tr><th>Student</th>' +
//         questionWeeks.map(w => `<th>W${w}</th>`).join('') +
//         '<th>Total</th></tr>'
//     activityBody.innerHTML = ''
//     const tr = document.createElement('tr')
//     tr.innerHTML = `<td class="highlight">${nameEl.textContent}</td>` +
//         questionWeeks.map(w => {
//           const cnt = filteredQuizzes.filter(q => q.week === w).length
//           return `<td>${cnt}</td>`
//         }).join('') +
//         `<td>${filteredQuizzes.length}</td>`
//     activityBody.appendChild(tr)
//   }
//
//   // 渲染排行榜
//   function renderLeaderboard() {
//     leaderboardBody.innerHTML = ''
//     const wk = weekSel.value === 'all'
//         ? questionWeeks
//         : [+weekSel.value]
//     const byUser: Record<string, Attempt[]> = {}
//     allAttempts.filter(a => wk.includes(a.week))
//         .forEach(a => (byUser[a.uid] ||= []).push(a))
//
//     Object.entries(byUser)
//         .map(([uid, arr]) => ({
//           uid,
//           name: userMap[uid] || 'Unknown',
//           avg:  average(arr.map(a => a.accuracy))
//         }))
//         .sort((a, b) => b.avg - a.avg)
//         .slice(0, 5)
//         .forEach((u, i) => {
//           const tr = document.createElement('tr')
//           tr.innerHTML = `<td>${i + 1}</td><td>${u.name}</td><td>${u.avg.toFixed(1)}%</td>`
//           if (u.uid === studentUid) tr.classList.add('highlight')
//           leaderboardBody.appendChild(tr)
//         })
//   }
//
//   // Auth & 初始化
//   // @ts-ignore
//   onAuthStateChanged(auth, async (user: User | null) => {
//     if (!user) {
//       location.href = '/login.html'
//       return
//     }
//     logoutBtn.addEventListener('click', async () => {
//       await signOut(auth)
//       location.href = '/login.html'
//     })
//
//     const email = new URLSearchParams(location.search).get('user')
//     if (!email) {
//       alert('缺少学生邮箱参数')
//       location.href = 'teacher_list.html'
//       return
//     }
//     await initData(email)
//   })
// })
// src/teacher_record.ts
// src/teacher_record.ts
import './styles.css'
import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import { auth, db } from '@modules/firebase'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import {
  collectionGroup,
  getDocs,
  query,
  where,
  collection,
  DocumentData
} from 'firebase/firestore'

Chart.register(annotationPlugin)

interface Quiz {
  week: number
  date: string
  correctCnt: number
  accuracy: number   // 百分比
  totalTime: number  // 秒
}
interface Attempt extends Quiz { uid: string }

// 图表实例句柄
let accuracyChart:   Chart<'line', number[], string> | null = null
let timeChart:       Chart<'bar',  number[], string> | null = null
let efficiencyChart: Chart<'line'|'bar', any, string> | null = null
let activityChart:   Chart<'line', number[], string> | null = null

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn       = document.getElementById('logoutBtn')    as HTMLElement
  const weekSel         = document.getElementById('weekSelector') as HTMLSelectElement
  const nameEl          = document.getElementById('studentName')  as HTMLElement
  const classEl         = document.getElementById('studentClass') as HTMLElement
  const avgEl           = document.getElementById('avgAccuracy')  as HTMLElement
  const trendEl         = document.getElementById('accuracyTrend')as HTMLElement
  const totalEl         = document.getElementById('totalAttempts')as HTMLElement
  const progressEl      = document.getElementById('weeklyProgress')as HTMLElement
  const calendarTbl     = document.getElementById('calendarTable')as HTMLTableElement
  const leaderboardBody = document.getElementById('leaderboardBody') as HTMLTableSectionElement

  let questionWeeks:   number[]              = []
  let allAttempts:     Attempt[]             = []
  let userMap:         Record<string,string> = {}
  let studentUid       = ''
  let studentQuizzes:  Quiz[]                = []
  let filteredQuizzes: Quiz[]                = []

  const average = (arr: number[]) =>
      arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0

  weekSel.addEventListener('change', () => {
    filteredQuizzes = weekSel.value === 'all'
        ? studentQuizzes
        : studentQuizzes.filter(q => q.week === +weekSel.value)
    initOverview()
    renderCharts()
    renderActivity()    // 折线图
    renderLeaderboard()
  })

  async function initData(email: string) {
    // 1. 获取所有周次
    const qSnap = await getDocs(collection(db, 'questions'))
    questionWeeks = Array.from(
        new Set<number>(
            qSnap.docs.map((d: { data: () => any }) => Number((d.data() as any).week))
        )
    ).sort((a, b) => a - b)

    // 2. 用户映射
    const uSnap = await getDocs(collection(db, 'users'))
    uSnap.forEach((d: { data: () => any; id: string | number }) => {
      const u = d.data() as any
      userMap[d.id] = u.name ?? u.email ?? 'Unknown'
    })

    // 3. 所有 attempts
    const allSnap = await getDocs(collectionGroup(db, 'quizAttempts'))
    allAttempts = allSnap.docs.map((d: { data: () => any; ref: { parent: { parent: { id: string } } } }) => {
      const data = d.data() as any
      const uid  = d.ref.parent.parent?.id || ''
      return {
        uid,
        week:      Number(data.week) || 0,
        date:      data.timestamp?.toDate?.().toLocaleDateString() || '',
        correctCnt:Number(data.correctCnt) || 0,
        totalTime: Number(data.totalTime)  || 0,
        accuracy:  typeof data.accuracy === 'number'
            ? data.accuracy * 100
            : data.totalCnt
                ? (Number(data.correctCnt) / Number(data.totalCnt)) * 100
                : 0
      }
    })

    // 4. 定位当前学生
    const userSnap = await getDocs(
        query(collection(db, 'users'), where('email','==', email))
    )
    if (userSnap.empty) {
      alert(`Student email not found：${email}`)
      location.href = 'teacher_list.html'
      return
    }
    const stud = userSnap.docs[0]
    studentUid  = stud.id
    // @ts-ignore
    const sData  = stud.data() as DocumentData
    nameEl.textContent  = sData.name  ?? email
    classEl.textContent = sData.class ?? '—'

    // 5. 拉取该学生的 attempts
    const aSnap = await getDocs(collection(db, 'users', studentUid, 'quizAttempts'))
    studentQuizzes = aSnap.docs.map((d: { data: () => any }) => {
      const data = d.data() as any
      return {
        week:      Number(data.week) || 0,
        date:      data.timestamp?.toDate?.().toLocaleDateString() || '',
        correctCnt:Number(data.correctCnt) || 0,
        totalTime: Number(data.totalTime)  || 0,
        accuracy:  typeof data.accuracy === 'number'
            ? data.accuracy * 100
            : data.totalCnt
                ? (Number(data.correctCnt) / Number(data.totalCnt)) * 100
                : 0
      }
    })

    filteredQuizzes = [...studentQuizzes]

    populateWeeks()
    initCalendar()
    initOverview()
    renderCharts()
    renderActivity()
    renderLeaderboard()
  }

  function populateWeeks() {
    weekSel.innerHTML = '<option value="all">All Weeks</option>'
    questionWeeks.forEach(w => {
      const o = document.createElement('option')
      o.value = String(w)
      o.textContent = 'Week ' + w
      weekSel.appendChild(o)
    })
  }

  function initCalendar() {
    const now   = new Date(),
        Y     = now.getFullYear(),
        M     = now.getMonth(),
        first = new Date(Y, M, 1).getDay(),
        dim   = new Date(Y, M + 1, 0).getDate()
    let html = '<thead><tr>' +
        ['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<th>${d}</th>`).join('') +
        '</tr></thead><tbody><tr>'
    for (let i = 0; i < first; i++) html += '<td></td>'
    for (let d = 1; d <= dim; d++) {
      const cls = d === now.getDate() ? ' class="today"' : ''
      html += `<td${cls}>${d}</td>`
      if ((first + d) % 7 === 0 && d < dim) html += '</tr><tr>'
    }
    html += '</tr></tbody>'
    calendarTbl.innerHTML = html
  }

  function initOverview() {
    if (!filteredQuizzes.length) {
      avgEl.textContent = totalEl.textContent = '0'
      trendEl.textContent = progressEl.textContent = '0%'
      return
    }
    avgEl.textContent   = average(filteredQuizzes.map(q=>q.accuracy)).toFixed(1) + '%'
    totalEl.textContent = String(filteredQuizzes.length)

    const weeks = Array.from(new Set(filteredQuizzes.map(q=>q.week))).sort((a,b)=>a-b)
    // @ts-ignore
    const last = weeks.at(-1)!, prev = weeks.length>1?weeks.at(-2)!:last
    const diff = average(filteredQuizzes.filter(q=>q.week===last).map(q=>q.accuracy))
        - average(filteredQuizzes.filter(q=>q.week===prev).map(q=>q.accuracy))
    const txt = (diff>=0?'+':'') + diff.toFixed(1) + '%'
    trendEl.textContent    = txt
    trendEl.className      = 'trend ' + (diff>=0?'up':'down')
    progressEl.textContent = txt
  }

  function renderCharts() {
    accuracyChart?.destroy()
    timeChart?.destroy()
    efficiencyChart?.destroy()

    const labels = questionWeeks.map(w=>'W'+w)
    const acc    = questionWeeks.map(w=>average(filteredQuizzes.filter(q=>q.week===w).map(q=>q.accuracy)))
    const time   = questionWeeks.map(w=>average(filteredQuizzes.filter(q=>q.week===w).map(q=>q.totalTime)))

    accuracyChart = new Chart(
        document.getElementById('accuracyChart') as HTMLCanvasElement,
        {
          type:'line',
          data:{ labels, datasets:[{ label:'Accuracy (%)', data:acc, tension:0.3 }]},
          options:{ scales:{ y:{ beginAtZero:true, max:100 }}}
        }
    )
    timeChart = new Chart(
        document.getElementById('timeChart') as HTMLCanvasElement,
        {
          type:'bar',
          data:{ labels, datasets:[{ label:'Average spending time (s)', data:time, backgroundColor:'#c7d2fe' }]},
          options:{ scales:{ y:{ beginAtZero:true }}}
        }
    )
    efficiencyChart = new Chart(
        document.getElementById('efficiencyChart') as HTMLCanvasElement,
        {
          data:{ labels, datasets:[
              { type:'line', label:'Accuracy (%)', yAxisID:'y1', data:acc },
              { type:'line', label:'Time (s)',   yAxisID:'y2', data:time }
            ]},
          options:{ scales:{
              y1:{ position:'left', beginAtZero:true, max:100 },
              y2:{ position:'right', beginAtZero:true }
            }}
        }
    )
  }

  // —— 折线图渲染“活跃度” ——
  function renderActivity() {
    activityChart?.destroy()
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement
    const labels = questionWeeks.map(w=>'W'+w)
    const data   = questionWeeks.map(w=>
        filteredQuizzes.filter(q=>q.week===w).length
    )
    activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Number of practices per week',
          data,
          fill: false,
          tension: 0.3,
          borderColor: '#4f46e5',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#4f46e5',
          pointRadius: 5
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    })
  }

  function renderLeaderboard() {
    leaderboardBody.innerHTML = ''
    const wk = weekSel.value==='all' ? questionWeeks : [+weekSel.value]
    const byUser: Record<string,Attempt[]> = {}
    allAttempts.filter(a=>wk.includes(a.week))
        .forEach(a=>(byUser[a.uid] ||= []).push(a))
    Object.entries(byUser)
        .map(([uid,arr])=>({
          uid,
          name:userMap[uid]||'Unknown',
          avg: average(arr.map(a=>a.accuracy))
        }))
        .sort((a,b)=>b.avg - a.avg).slice(0,5)
        .forEach((u,i)=>{
          const tr = document.createElement('tr')
          tr.innerHTML = `<td>${i+1}</td><td>${u.name}</td><td>${u.avg.toFixed(1)}%</td>`
          if(u.uid===studentUid) tr.classList.add('highlight')
          leaderboardBody.appendChild(tr)
        })
  }

  // @ts-ignore
  onAuthStateChanged(auth, async (user: User|null) => {
    if(!user){ location.href='/login.html'; return }
    logoutBtn.addEventListener('click', async ()=>{
      await signOut(auth)
      location.href='/login.html'
    })
    const email = new URLSearchParams(location.search).get('user')
    if(!email){
      alert('Missing student email parameters')
      location.href='teacher_list.html'
      return
    }
    await initData(email)
  })
})