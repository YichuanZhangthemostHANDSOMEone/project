// // src/register.ts
//
// import './styles.css';
//
// import { auth } from '@modules/firebase';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
//
// window.addEventListener('DOMContentLoaded', () => {
//     // Header 上 “Login” 按钮
//     const loginBtn = document.getElementById('loginBtn');
//     if (loginBtn) {
//         loginBtn.addEventListener('click', () => {
//             window.location.href = '/login.html';
//         });
//     }
//
//     // “Already have an account? Login” 链接
//     const showLogin = document.getElementById('showLogin');
//     if (showLogin) {
//         showLogin.addEventListener('click', e => {
//             e.preventDefault();
//             window.location.href = '/login.html';
//         });
//     }
//
//     // 注册表单
//     const registerForm = document.getElementById('registerForm');
//     if (registerForm) {
//         registerForm.addEventListener('submit', async e => {
//             e.preventDefault();
//             const emailInput = document.getElementById('email') as HTMLInputElement;
//             const passInput = document.getElementById('password') as HTMLInputElement;
//
//             try {
//                 await createUserWithEmailAndPassword(
//                     auth,
//                     emailInput.value,
//                     passInput.value
//                 );
//                 // 注册成功后自动跳回登录页
//                 window.location.href = '/login.html';
//             } catch (err: any) {
//                 alert('Registration failed: ' + err.message);
//             }
//         });
//     }
// });
import './styles.css';
import { auth, db } from '@modules/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';

window.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    loginBtn?.addEventListener('click', () => {
        window.location.href = '/login.html';
    });

    const registerForm = document.getElementById('registerForm');
    registerForm?.addEventListener('submit', async e => {
        e.preventDefault();

        const nameEl = document.getElementById('nameInput') as HTMLInputElement;
        const emailEl = document.getElementById('emailInput') as HTMLInputElement;
        const passwordEl = document.getElementById('passwordInput') as HTMLInputElement;
        const roleEl = document.getElementById('roleSelect') as HTMLSelectElement;

        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const password = passwordEl.value;
        const role = roleEl.value;

        if (!name || !email || !password) {
            alert('请填写所有字段。');
            return;
        }

        try {
            // 1. 检查用户名在 Firestore 中是否已存在
            const nameQ = query(
                collection(db, 'users'),
                where('name', '==', name)
            );
            const nameSnap = await getDocs(nameQ);
            if (!nameSnap.empty) {
                alert('用户名已存在，请选择其他用户名。');
                return;
            }

            // 2. 使用 Firebase Auth 创建用户（已自动防止重复 email）
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCred.user.uid;

            // 3. 将用户资料写入 Firestore
            await setDoc(doc(db, 'users', uid), {
                name,
                email,
                role,
                createdAt: serverTimestamp()
            });

            // 注册完成，跳转到登录页
            window.location.href = '/login.html';
        } catch (err: any) {
            // 处理 email 重复的错误
            if (err.code === 'auth/email-already-in-use') {
                alert('该邮箱已被注册，请直接登录或使用其他邮箱。');
            } else {
                alert('注册失败：' + err.message);
            }
        }
    });
});