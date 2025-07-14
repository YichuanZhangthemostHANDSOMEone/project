// src/quiz_editor.ts
import './styles.css';
import { auth, db } from '@modules/firebase';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
  const weekSelect = document.getElementById('weekSelect') as HTMLSelectElement;
  const form       = document.getElementById('questionForm') as HTMLFormElement;
  const logoutBtn  = document.getElementById('logoutBtn') as HTMLButtonElement | null;
  const list       = document.getElementById('questionList') as HTMLElement;
  const submitBtn  = document.getElementById('submitBtn') as HTMLButtonElement;

  let editId: string | null = null;

  // 加载并渲染这一周的题目
  async function load() {
    const week = parseInt(weekSelect.value, 10);
    const snap = await getDocs(
        query(collection(db, 'questions'), where('week', '==', week))
    );

    list.innerHTML = '';
    snap.docs.forEach((ds: { data: () => any; id: string | null; }) => {
      const d = ds.data() as any;

      // 列表项容器
      const li = document.createElement('li');
      li.classList.add('question-item');
      li.innerHTML = `<span class="text">${d.id}. ${d.prompt}</span>`;

      // 编辑按钮
      const editBtn = document.createElement('button');
      editBtn.classList.add('btn-edit');
      editBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        编辑
      `;
      editBtn.onclick = () => {
        // 填表
        (document.getElementById('promptInput') as HTMLTextAreaElement).value = d.prompt;
        document.querySelectorAll<HTMLInputElement>('.option-input')
            .forEach((inp, idx) => inp.value = d.options[idx] || '');
        (document.getElementById('correctIndex') as HTMLSelectElement).value =
            d.correctIndex.toString();

        editId = ds.id;
        submitBtn.textContent = '更新';
      };

      // 删除按钮
      const delBtn = document.createElement('button');
      delBtn.classList.add('btn-delete');
      delBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2">
          <path d="M3 6h18"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/>
          <path d="M10 10v6"/><path d="M14 10v6"/>
        </svg>
        删除
      `;
      delBtn.onclick = async () => {
        await deleteDoc(doc(db, 'questions', ds.id));
        if (editId === ds.id) {
          form.reset();
          editId = null;
          submitBtn.textContent = '添加问题';
        }
        await load();
      };

      // 操作按钮容器
      const actions = document.createElement('div');
      actions.classList.add('actions');
      actions.append(editBtn, delBtn);

      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  // 表单提交：添加或更新
  form.onsubmit = async e => {
    e.preventDefault();
    const promptInput = (document.getElementById('promptInput') as HTMLTextAreaElement).value;
    const opts = Array.from(document.querySelectorAll<HTMLInputElement>('.option-input'))
        .map(i => i.value);
    const correctIndex = parseInt(
        (document.getElementById('correctIndex') as HTMLSelectElement).value,
        10
    );

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
    submitBtn.textContent = '添加问题';
    await load();
  };

  // 切换周时刷新
  weekSelect.onchange = load;

  // 登出
  logoutBtn?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = '/login.html';
  });

  // 首次加载
  load();
});