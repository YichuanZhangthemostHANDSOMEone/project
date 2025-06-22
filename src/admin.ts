import { onUserChanged, getUserRole } from '@modules/auth';
import { db } from '@modules/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function loadRecords() {
  const recordsEl = document.getElementById('records');
  if (!recordsEl) return;
  const col = collection(db, 'records');
  const snap = await getDocs(col);
  recordsEl.innerHTML = '';
  snap.forEach((doc: any) => {
    const data = doc.data() as { studentId?: string; score?: number };
    const li = document.createElement('li');
    li.textContent = `${data.studentId}: ${data.score}`;
    recordsEl.appendChild(li);
  });
}

onUserChanged(async (user) => {
  if (!user) {
    location.href = '/index.html';
    return;
  }
  const role = await getUserRole(user.uid);
  if (role !== 'teacher') {
    location.href = '/student.html';
    return;
  }
  loadRecords();
});
