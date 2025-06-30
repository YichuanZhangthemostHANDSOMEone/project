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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

window.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    loginBtn?.addEventListener('click', () => {
        window.location.href = '/login.html';
    });

    const registerForm = document.getElementById('registerForm');
    registerForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const name = (document.getElementById('nameInput') as HTMLInputElement).value.trim();
        const email = (document.getElementById('email') as HTMLInputElement).value.trim();
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const role = (document.getElementById('roleSelect') as HTMLSelectElement).value;
        if (!name || !email || !password) {
            alert('请填写所有字段。');
            return;
        }
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCred.user.uid;
            // 保存用户资料到 Firestore
            await setDoc(doc(db, 'users', uid), {
                name,
                email,
                role,
                createdAt: serverTimestamp()
            });
            window.location.href = '/login.html';
        } catch (err: any) {
            alert('注册失败：' + err.message);
        }
    });
});