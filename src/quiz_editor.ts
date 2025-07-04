import './styles.css';
import { auth, db } from '@modules/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';


document.addEventListener('DOMContentLoaded', () => {
  const weekSelect  = document.getElementById('weekSelect') as HTMLSelectElement;
  const form        = document.getElementById('questionForm') as HTMLFormElement;
  const logoutBtn   = document.getElementById('logoutBtn') as HTMLButtonElement | null;
  const list        = document.getElementById('questionList') as HTMLElement;
  const submitBtn   = document.getElementById('submitBtn') as HTMLButtonElement;

  let editId: string | null = null;

  async function load() {
    const week = parseInt(weekSelect.value, 10);
    console.log(`Loading questions for week: ${week}`);
    const snap = await getDocs(query(collection(db, 'questions'), where('week','==',week)));

    list.innerHTML = '';
    snap.docs.forEach((ds: { data: () => any; id: string | null; }) => {
      const d = ds.data() as any;
      const li = document.createElement('li');
      li.textContent = `${d.id}. ${d.prompt} `;

      // 编辑按钮
      const editBtn = document.createElement('button');
      editBtn.textContent = '编辑';
      editBtn.onclick = () => {
        (document.getElementById('promptInput') as HTMLInputElement).value = d.prompt;
        document.querySelectorAll<HTMLInputElement>('.option-input')
            .forEach((inp, idx) => inp.value = d.options[idx] || '');
        (document.getElementById('correctIndex') as HTMLSelectElement).value = d.correctIndex.toString();

        editId = ds.id;
        submitBtn.textContent = '更新';
      };

      // 删除按钮
      const delBtn = document.createElement('button');
      delBtn.textContent = '删除';
      delBtn.onclick = async () => {
        await deleteDoc(doc(db, 'questions', ds.id));
        // 如果删掉的是正在编辑的那条，重置表单
        if (editId === ds.id) {
          form.reset();
          editId = null;
          submitBtn.textContent = '添加';
        }
        // 删完再刷新列表
        await load();
      };

      li.append(editBtn, delBtn);
      list.appendChild(li);
    });
  }

  // 表单提交：添加或更新
  form.onsubmit = async e => {
    e.preventDefault();
    const promptInput = (document.getElementById('promptInput') as HTMLInputElement).value;
    const opts = Array.from(document.querySelectorAll<HTMLInputElement>('.option-input')).map(i => i.value);
    const correctIndex = parseInt((document.getElementById('correctIndex') as HTMLSelectElement).value, 10);

    if (editId) {
      // 更新
      await updateDoc(doc(db, 'questions', editId), {
        prompt: promptInput,
        options: opts,
        correctIndex,
      });
    } else {
      // 新增
      await addDoc(collection(db, 'questions'), {
        week: parseInt(weekSelect.value, 10),
        prompt: promptInput,
        options: opts,
        correctIndex,
      });
    }

    form.reset();
    editId = null;
    submitBtn.textContent = '添加';
    await load();
  };

  // 选周变化时刷新
  weekSelect.onchange = load;

  // 登出按钮
  logoutBtn?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '/login.html';
  });

  // 首次加载
  load();
});