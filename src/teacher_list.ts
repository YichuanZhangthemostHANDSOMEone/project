// import './styles.css'
// import { auth, db } from '@modules/firebase'
// import { onAuthStateChanged, signOut, User } from 'firebase/auth'
// import { collectionGroup, getDocs, doc, getDoc } from 'firebase/firestore'
//
// interface Student {
//     name: string
//     email: string
//     count: number
//     rank: number
// }
//
// document.addEventListener('DOMContentLoaded', () => {
//     const logoutBtn   = document.getElementById('logoutBtn')
//     const addBtn      = document.getElementById('addStudentBtn')
//     const searchInput = document.getElementById('searchInput')  as HTMLInputElement | null
//     const tableBody   = document.querySelector('#studentTable tbody') as HTMLTableSectionElement | null
//     const sortBtn     = document.getElementById('sortBtn')
//     const filterBtn   = document.getElementById('filterBtn')
//
//     let students: Student[] = []
//     let sortMode: 'name'|'count'|'rank' = 'name'
//
//     // @ts-ignore
//     onAuthStateChanged(auth, async (user: User | null) => {
//         if (!user) {
//             window.location.href = '/login.html'
//             return
//         }
//
//         // 仅 teacher 可进
//         const meDoc  = await getDoc(doc(db, 'users', user.uid))
//         const myRole = meDoc.exists() ? (meDoc.data() as any).role : null
//         if (myRole !== 'teacher') {
//             window.location.href = '/student_record.html'
//             return
//         }
//
//         // 登出
//         if (logoutBtn) {
//             logoutBtn.addEventListener('click', async () => {
//                 await signOut(auth)
//                 window.location.href = '/login.html'
//             })
//         }
//
//         // + Add Student （示例：跳转到添加页）
//         if (addBtn) {
//             addBtn.addEventListener('click', () => {
//                 window.location.href = '/add_student.html'
//             })
//         }
//
//         // 拉出所有 quizAttempts
//         const snap = await getDocs(collectionGroup(db, 'quizAttempts'))
//         const byUser: Record<string, any[]> = {}
//         snap.docs.forEach((docSnap: { data: () => any; ref: { parent: { parent: { id: any } } } }) => {
//             const rec = docSnap.data()
//             const uid = docSnap.ref.parent.parent?.id
//             if (!uid) return
//             byUser[uid] = byUser[uid] || []
//             byUser[uid].push(rec)
//         })
//
//         // 构造列表
//         const list: Student[] = []
//         for (const uid of Object.keys(byUser)) {
//             const recs = byUser[uid]
//             const count = recs.length
//             const rank = recs.reduce((min, r) => {
//                 const w = Number(r.weekRank)
//                 return !isNaN(w) ? Math.min(min, w) : min
//             }, Infinity)
//
//             const userDoc = await getDoc(doc(db, 'users', uid))
//             const udata   = userDoc.exists() ? userDoc.data() as any : {}
//             const email   = udata.email ?? ''
//             const name    = udata.name ?? email.split('@')[0] ?? uid
//
//             list.push({ name, email, count, rank })
//         }
//
//         students = list
//         renderTable(students)
//     })
//
//     function renderTable(data: Student[]) {
//         if (!tableBody) return
//         tableBody.innerHTML = ''
//         data.forEach(stu => {
//             const tr = document.createElement('tr')
//             tr.className = 'student-row'
//             tr.innerHTML = `
//         <td>${stu.name}</td>
//         <td>${stu.email}</td>
//         <td><span class="status-pill ${
//                 stu.rank === Infinity ? 'inactive' : 'active'
//             }">${stu.rank === Infinity ? 'Inactive' : 'Active'}</span></td>
//         <td>${stu.rank === Infinity ? '-' : stu.rank}</td>
//         <td>
//           <button class="menu-btn" title="更多">
//             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
//               <circle cx="12" cy="5" r="2"/>
//               <circle cx="12" cy="12" r="2"/>
//               <circle cx="12" cy="19" r="2"/>
//             </svg>
//           </button>
//         </td>`
//             // 整行点击跳详情
//             tr.addEventListener('click', () => {
//                 window.location.href = `teacher_record.html?user=${encodeURIComponent(stu.email)}`
//             })
//             tableBody.appendChild(tr)
//         })
//     }
//
//     // 搜索
//     if (searchInput) {
//         searchInput.addEventListener('input', e => {
//             const kw = (e.target as HTMLInputElement).value.trim().toLowerCase()
//             renderTable(
//                 students.filter(s => s.name.toLowerCase().includes(kw))
//             )
//         })
//     }
//
//     // 排序
//     if (sortBtn) {
//         sortBtn.addEventListener('click', () => {
//             if (sortMode === 'name') {
//                 students.sort((a,b)=>a.name.localeCompare(b.name))
//                 sortMode = 'count'
//             } else if (sortMode === 'count') {
//                 students.sort((a,b)=>b.count - a.count)
//                 sortMode = 'rank'
//             } else {
//                 students.sort((a,b)=>{
//                     const ra = a.rank===Infinity?Number.MAX_VALUE:a.rank
//                     const rb = b.rank===Infinity?Number.MAX_VALUE:b.rank
//                     return ra - rb
//                 })
//                 sortMode = 'name'
//             }
//             renderTable(students)
//         })
//     }
//
//     // Filter（占位，未实现）
//     if (filterBtn) {
//         filterBtn.addEventListener('click', ()=>alert('Filter 功能待实现'))
//     }
// })

import './styles.css';
import { auth, db } from '@modules/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collectionGroup, getDocs, doc, getDoc } from 'firebase/firestore';

interface Student {
    name: string;
    email: string;
    count: number;
    rank: number;
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn   = document.getElementById('logoutBtn');
    const addBtn      = document.getElementById('addStudentBtn');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const tableBody   = document.querySelector('#studentTable tbody') as HTMLTableSectionElement;
    const sortBtn     = document.getElementById('sortBtn');
    const filterBtn   = document.getElementById('filterBtn');

    let students: Student[] = [];
    let sortMode: 'name'|'count'|'rank' = 'name';

    // 监听 auth 状态
    // @ts-ignore
    onAuthStateChanged(auth, async (user: User|null) => {
        if (!user) {
            location.href = '/login.html';
            return;
        }

        // 只有老师可访问
        const meDoc = await getDoc(doc(db, 'users', user.uid));
        const role = meDoc.exists() ? (meDoc.data() as any).role : null;
        if (role !== 'teacher') {
            location.href = '/student_record.html';
            return;
        }

        // 登出
        logoutBtn?.addEventListener('click', async () => {
            await signOut(auth);
            location.href = '/login.html';
        });

        // Add Student
        addBtn?.addEventListener('click', () => {
            location.href = '/add_student.html';
        });

        // 拉取所有 quizAttempts 并按用户分组
        const snap = await getDocs(collectionGroup(db, 'quizAttempts'));
        const byUser: Record<string, any[]> = {};
        snap.docs.forEach((d: { data: () => any; ref: { parent: { parent: { id: any; }; }; }; }) => {
            const rec = d.data();
            const uid = d.ref.parent.parent?.id;
            if (!uid) return;
            byUser[uid] = byUser[uid] || [];
            byUser[uid].push(rec);
        });

        // 构造 students 数组
        const list: Student[] = [];
        for (const uid of Object.keys(byUser)) {
            const recs = byUser[uid];
            const count = recs.length;
            const rank = recs.reduce((min, r) => {
                const w = Number(r.weekRank);
                return !isNaN(w) ? Math.min(min, w) : min;
            }, Infinity);

            const userDoc = await getDoc(doc(db, 'users', uid));
            const data = userDoc.exists() ? userDoc.data() as any : {};
            const email = data.email ?? '';
            const name  = data.name ?? email.split('@')[0] ?? uid;

            list.push({ name, email, count, rank });
        }

        students = list;
        renderTable(students);
    });

    // 渲染表格
    function renderTable(data: Student[]) {
        tableBody.innerHTML = '';
        data.forEach(stu => {
            const tr = document.createElement('tr');
            tr.className = 'student-row';
            tr.innerHTML = `
        <td>${stu.name}</td>
        <td>${stu.email}</td>
        <td>
          <span class="status-pill ${stu.rank === Infinity ? 'inactive' : 'active'}">
            ${stu.rank === Infinity ? 'Inactive' : 'Active'}
          </span>
        </td>
        <td>${stu.rank === Infinity ? '-' : stu.rank}</td>
        <td>
          <button class="menu-btn" title="更多">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
        </td>`;
            // 点整行跳转
            tr.addEventListener('click', () => {
                window.location.href = `teacher_record.html?user=${encodeURIComponent(stu.email)}`;
            });
            tableBody.appendChild(tr);
        });
    }

    // 搜索
    searchInput.addEventListener('input', e => {
        const kw = (e.target as HTMLInputElement).value.trim().toLowerCase();
        renderTable(students.filter(s => s.name.toLowerCase().includes(kw)));
    });

    // 排序：name → count → rank → name ...
    sortBtn?.addEventListener('click', () => {
        if (sortMode === 'name') {
            students.sort((a,b)=>a.name.localeCompare(b.name));
            sortMode = 'count';
        } else if (sortMode === 'count') {
            students.sort((a,b)=>b.count - a.count);
            sortMode = 'rank';
        } else {
            students.sort((a,b)=>{
                const ra = a.rank===Infinity?Number.MAX_VALUE:a.rank;
                const rb = b.rank===Infinity?Number.MAX_VALUE:b.rank;
                return ra - rb;
            });
            sortMode = 'name';
        }
        renderTable(students);
    });

    // Filter（可自行实现）
    filterBtn?.addEventListener('click', () => {
        alert('The Filter function is yet to be implemented.');
    });
});