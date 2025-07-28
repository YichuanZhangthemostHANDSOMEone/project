// // import './styles.css';
// // // import { auth } from '@modules/firebase';
// // // import { signInWithEmailAndPassword } from 'firebase/auth';
// // import { auth } from '@modules/firebase';
// // import {
// //     signInWithEmailAndPassword,
// //     GoogleAuthProvider,
// //     signInWithPopup
// // } from 'firebase/auth';
// // window.addEventListener('DOMContentLoaded', () => {
// //     // 元素引用
// //     const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
// //     const googleBtn = document.getElementById('googleBtn') as HTMLButtonElement;
// //     const loginForm = document.getElementById('loginForm') as HTMLFormElement;
// //     const emailGroup = document.getElementById('emailGroup') as HTMLDivElement;
// //     const passwordGroup = document.getElementById('passwordGroup') as HTMLDivElement;
// //     const emailInput = document.getElementById('emailInput') as HTMLInputElement;
// //     const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
// //     const formBtn = document.getElementById('formBtn') as HTMLButtonElement;
// //     const showRegister = document.getElementById('showRegister') as HTMLAnchorElement;
// //
// //     let step = 1;
// //     let savedEmail = '';
// //
// //     // 顶部 Login 按钮跳转
// //     loginBtn?.addEventListener('click', () => {
// //         window.location.href = '/login.html';
// //     });
// //
// //     // Register 跳转
// //     showRegister?.addEventListener('click', e => {
// //         e.preventDefault();
// //         window.location.href = '/register.html';
// //     });
// //
// //     // 表单提交
// //     loginForm.addEventListener('submit', async e => {
// //         e.preventDefault();
// //         if (step === 1) {
// //             // 第一步：保存邮箱，切换到密码输入
// //             savedEmail = emailInput.value.trim();
// //             if (!savedEmail) {
// //                 alert('Please enter a valid email.');
// //                 return;
// //             }
// //             // 隐藏第一步元素
// //             emailGroup.classList.add('hidden');
// //             googleBtn.classList.add('hidden');
// //             document.querySelector('.divider')?.classList.add('hidden');
// //             // 展示密码输入
// //             passwordGroup.classList.remove('hidden');
// //             // 切换按钮文字
// //             formBtn.textContent = 'Log in';
// //             step = 2;
// //             passwordInput.focus();
// //         } else {
// //             // 第二步：实际登录
// //             const pwd = passwordInput.value;
// //             if (!pwd) {
// //                 alert('Please enter your password.');
// //                 return;
// //             }
// //             try {
// //                 await signInWithEmailAndPassword(auth, savedEmail, pwd);
// //                 window.location.href = '/';
// //             } catch (err: any) {
// //                 alert('Login failed: ' + err.message);
// //             }
// //         }
// //     });
// // });
//
// // login.ts
// import './styles.css';
// import { auth, db } from '@modules/firebase';
// import {
//     signInWithEmailAndPassword,
//     GoogleAuthProvider,
//     signInWithPopup
// } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
//
// window.addEventListener('DOMContentLoaded', () => {
//     // —— 元素引用 —— //
//     const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
//     const googleBtn = document.getElementById('googleBtn') as HTMLButtonElement;
//     const loginForm = document.getElementById('loginForm') as HTMLFormElement;
//     const emailGroup = document.getElementById('emailGroup') as HTMLDivElement;
//     const passwordGroup = document.getElementById('passwordGroup') as HTMLDivElement;
//     const emailInput = document.getElementById('emailInput') as HTMLInputElement;
//     const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
//     const formBtn = document.getElementById('formBtn') as HTMLButtonElement;
//     const showRegister = document.getElementById('showRegister') as HTMLAnchorElement;
//
//     let step = 1;
//     let savedEmail = '';
//
//     async function redirectAfterLogin(user: any) {
//         const snap = await getDoc(doc(db, 'users', user.uid));
//         let role = 'student';
//         if (snap.exists()) {
//             // @ts-ignore
//             role = (snap.data() as any).role;
//         } else if (user.email === 'steve.kerrison@jcu.edu.au') {
//             role = 'teacher';
//         }
//         window.location.href = role === 'teacher' ? '/teacher_record.html' : '/';
//     }
//
//     // —— 顶部 “Login” 按钮跳到登录页 —— //
//     loginBtn?.addEventListener('click', () => {
//         window.location.href = '/login.html';
//     });
//
//     // —— “Register” 跳转 —— //
//     showRegister?.addEventListener('click', e => {
//         e.preventDefault();
//         window.location.href = '/register.html';
//     });
//
//     // —— Google 登录 —— //
//     const provider = new GoogleAuthProvider();
//     provider.setCustomParameters({ prompt: 'select_account' }); // 每次都让用户选账号
//
//     googleBtn?.addEventListener('click', async () => {
//         try {
//             const result = await signInWithPopup(auth, provider);
//             console.log('Google 登录成功 →', result.user);
//             await redirectAfterLogin(result.user);
//         } catch (err: any) {
//             console.error('Google 登录失败 →', err);
//             alert('Google 登录失败：' + err.message);
//         }
//     });
//
//     // —— 邮箱/密码两步登录 —— //
//     loginForm.addEventListener('submit', async e => {
//         e.preventDefault();
//
//         if (step === 1) {
//             // 第一步：输入邮箱，切换到密码
//             savedEmail = emailInput.value.trim();
//             if (!savedEmail) {
//                 alert('Please enter a valid email.');
//                 return;
//             }
//             // 隐藏邮箱输入和 Google 按钮
//             emailGroup.classList.add('hidden');
//             googleBtn.classList.add('hidden');
//             document.querySelector('.divider')?.classList.add('hidden');
//             // 显示密码输入
//             passwordGroup.classList.remove('hidden');
//             // 切换按钮文字
//             formBtn.textContent = 'Log in';
//             passwordInput.focus();
//             step = 2;
//
//         } else {
//             // 第二步：提交密码，真正登录
//             const pwd = passwordInput.value;
//             if (!pwd) {
//                 alert('Please enter your password.');
//                 return;
//             }
//             try {
//                 const result = await signInWithEmailAndPassword(auth, savedEmail, pwd);
//                 console.log('邮箱/密码 登录成功 →', savedEmail);
//                 await redirectAfterLogin(result.user);
//             } catch (err: any) {
//                 console.error('Email 登录失败 →', err);
//                 alert('Login failed: ' + err.message);
//             }
//         }
//     });
// });

// src/login.ts — updated 2025-07-14
// ✅ 老师登录后先回到首页（index.html），其余逻辑不变

import './styles.css';
import { auth, db } from '@modules/firebase';
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    UserCredential
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

window.addEventListener('DOMContentLoaded', () => {
    /* ---------- DOM ---------- */
    const loginBtn      = document.getElementById('loginBtn')      as HTMLButtonElement;
    const googleBtn     = document.getElementById('googleBtn')     as HTMLButtonElement;
    const loginForm     = document.getElementById('loginForm')     as HTMLFormElement;
    const emailGroup    = document.getElementById('emailGroup')    as HTMLDivElement;
    const passwordGroup = document.getElementById('passwordGroup') as HTMLDivElement;
    const emailInput    = document.getElementById('emailInput')    as HTMLInputElement;
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
    const formBtn       = document.getElementById('formBtn')       as HTMLButtonElement;
    const showRegister  = document.getElementById('showRegister')  as HTMLAnchorElement;

    let step = 1;
    let savedEmail = '';

    /* ---------- Helpers ---------- */
    // @ts-ignore
    async function redirectAfterLogin(cred: UserCredential) {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        /* 默认是学生。老师（role==='teacher' 或特定邮箱）先返回首页（/） */
        let role = 'student';
        if (snap.exists()) {
            role = (snap.data() as any).role;
        } else if (cred.user.email === 'steve.kerrison@jcu.edu.au') {
            role = 'teacher';
        }
        window.location.href = '/';            // 不分角色，全回 index.html
    }

    /* ---------- Top actions ---------- */
    loginBtn?.addEventListener('click', () => (window.location.href = '/login.html'));
    showRegister?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/register.html'; });

    /* ---------- Google ---------- */
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    googleBtn?.addEventListener('click', async () => {
        try {
            const cred = await signInWithPopup(auth, provider);
            await redirectAfterLogin(cred);
        } catch (err: any) {
            alert('Google log fail!!：' + err.message);
        }
    });

    /* ---------- Email two-step ---------- */
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (step === 1) {
            savedEmail = emailInput.value.trim();
            if (!savedEmail) return alert('Please enter a valid email.');
            emailGroup.classList.add('hidden');
            googleBtn.classList.add('hidden');
            document.querySelector('.divider')?.classList.add('hidden');
            passwordGroup.classList.remove('hidden');
            formBtn.textContent = 'Log in';
            passwordInput.focus();
            step = 2;
            return;
        }

        /* step 2: real login */
        const pwd = passwordInput.value;
        if (!pwd) return alert('Please enter your password.');
        try {
            const cred = await signInWithEmailAndPassword(auth, savedEmail, pwd);
            await redirectAfterLogin(cred);
        } catch (err: any) {
            alert('Login failed: ' + err.message);
        }
    });
});
