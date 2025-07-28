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
// import './styles.css';
// import { auth, db } from '@modules/firebase';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import {
//     collection,
//     doc,
//     getDocs,
//     query,
//     serverTimestamp,
//     setDoc,
//     where
// } from 'firebase/firestore';
//
// window.addEventListener('DOMContentLoaded', () => {
//     const loginBtn = document.getElementById('loginBtn');
//     loginBtn?.addEventListener('click', () => {
//         window.location.href = '/login.html';
//     });
//
//     const registerForm = document.getElementById('registerForm');
//     registerForm?.addEventListener('submit', async e => {
//         e.preventDefault();
//
//         const nameEl = document.getElementById('nameInput') as HTMLInputElement;
//         const emailEl = document.getElementById('emailInput') as HTMLInputElement;
//         const passwordEl = document.getElementById('passwordInput') as HTMLInputElement;
//         const roleEl = document.getElementById('roleSelect') as HTMLSelectElement;
//
//         const name = nameEl.value.trim();
//         const email = emailEl.value.trim();
//         const password = passwordEl.value;
//         const role = roleEl.value;
//
//         if (!name || !email || !password) {
//             alert('Please fill in all the fields.。');
//             return;
//         }
//
//         try {
//             // 1. 检查用户名在 Firestore 中是否已存在
//             const nameQ = query(
//                 collection(db, 'users'),
//                 where('name', '==', name)
//             );
//             const nameSnap = await getDocs(nameQ);
//             if (!nameSnap.empty) {
//                 alert('The username is already taken. Please choose another one.');
//                 return;
//             }
//
//             // 2. 使用 Firebase Auth 创建用户（已自动防止重复 email）
//             const userCred = await createUserWithEmailAndPassword(auth, email, password);
//             const uid = userCred.user.uid;
//
//             // 3. 将用户资料写入 Firestore
//             await setDoc(doc(db, 'users', uid), {
//                 name,
//                 email,
//                 role,
//                 createdAt: serverTimestamp()
//             });
//
//             // 注册完成，跳转到登录页
//             window.location.href = '/login.html';
//         } catch (err: any) {
//             // 处理 email 重复的错误
//             if (err.code === 'auth/email-already-in-use') {
//                 alert('This email address has already been registered. Please log in directly or use another email address.');
//             } else {
//                 alert('fail to register：' + err.message);
//             }
//         }
//     });
// });

// src/register.ts
import './styles.css';
import { auth, db } from '@modules/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';

window.addEventListener('DOMContentLoaded', () => {
    // “Already have an account? Login” 链接
    const switchLink = document.querySelector('.switch-text a') as HTMLAnchorElement | null;
    switchLink?.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/login.html';
    });

    const registerForm = document.getElementById('registerForm') as HTMLFormElement | null;
    registerForm?.addEventListener('submit', async e => {
        e.preventDefault();

        const nameEl     = document.getElementById('nameInput')    as HTMLInputElement;
        const emailEl    = document.getElementById('emailInput')   as HTMLInputElement;
        const passwordEl = document.getElementById('passwordInput')as HTMLInputElement;
        const roleEl     = document.getElementById('roleSelect')   as HTMLSelectElement;

        const name     = nameEl.value.trim();
        const email    = emailEl.value.trim();
        const password = passwordEl.value;
        const role     = roleEl.value;

        if (!name || !email || !password) {
            alert('Please fill in all the fields.');
            return;
        }

        try {
            // 1. 创建 Auth 用户（并自动登录）
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCred.user.uid;

            // 2. 用户名查重（此时 request.auth != null，规则允许 list）
            const nameQ    = query(collection(db, 'users'), where('name', '==', name));
            const nameSnap = await getDocs(nameQ);
            if (!nameSnap.empty) {
                // 重复：删除刚创建的 Auth 账号，再提示
                await userCred.user.delete();
                alert('The username is already taken. Please choose another one.');
                return;
            }

            // 3. 写入 Firestore users/{uid}
            await setDoc(doc(db, 'users', uid), {
                name,
                email,
                role,
                createdAt: serverTimestamp()
            });

            // 4. 跳回登录页
            window.location.href = '/login.html';

        } catch (err: any) {
            console.error('Registration error', err);
            if (err.code === 'auth/email-already-in-use') {
                alert('This email address has already been registered. Please log in or use another email.');
            } else {
                alert('Failed to register: ' + err.message);
            }
        }
    });
});