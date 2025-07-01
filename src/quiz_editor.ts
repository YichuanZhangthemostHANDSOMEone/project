import './styles.css';
import { auth, db } from '@modules/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const TEACHER_EMAIL = 'steve.kerrison@jcu.edu.au';

document.addEventListener('DOMContentLoaded', () => {
  const weekSelect  = document.getElementById('weekSelect') as HTMLSelectElement;
  const form        = document.getElementById('questionForm') as HTMLFormElement;
  const logoutBtn   = document.getElementById('logoutBtn') as HTMLButtonElement | null;
  const list        = document.getElementById('questionList') as HTMLElement;

  // 加载当前周题目
  async function load() {
    const week = parseInt(weekSelect.value, 10);
    const snap = await getDocs(query(collection(db, 'questions'), where('week','==',week)));
    list.innerHTML = '';
    snap.docs.forEach((ds: any) => {
      const d = ds.data() as any;
      const li = document.createElement('li');
      li.textContent = `${d.id}. ${d.prompt}`;
      const del = document.createElement('button');
      del.textContent = '删除';
      del.onclick = async () => {
        await deleteDoc(doc(db, 'questions', ds.id));
        await load();
      };
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  // @ts-ignore
  onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) return (window.location.href = '/login.html');
    if (user.email !== TEACHER_EMAIL) {
      window.location.href = '/';
      return;
    }
    await load();
    logoutBtn && (logoutBtn.onclick = async () => { await signOut(auth); window.location.href = '/login.html'; });
  });

  weekSelect.onchange = load;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const week = parseInt(weekSelect.value, 10);
    const prompt = (document.getElementById('promptInput') as HTMLInputElement).value.trim();
    const opts = Array.from(document.querySelectorAll<HTMLInputElement>('.option-input')).map(i => i.value.trim());
    const correctIndex = parseInt((document.getElementById('correctIndex') as HTMLSelectElement).value, 10);
    if (!prompt || opts.some(o => !o)) return alert('请完整填写题目和选项');
    const snap = await getDocs(query(collection(db, 'questions'), where('week','==',week)));
    const id = snap.size + 1;
    await addDoc(collection(db, 'questions'), { week, id, prompt, options: opts, correctIndex });
    form.reset();
    await load();
  });
});
