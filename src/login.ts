// import './styles.css';
// // import { auth } from '@modules/firebase';
// // import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '@modules/firebase';
// import {
//     signInWithEmailAndPassword,
//     GoogleAuthProvider,
//     signInWithPopup
// } from 'firebase/auth';
// window.addEventListener('DOMContentLoaded', () => {
//     // 元素引用
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
//     // 顶部 Login 按钮跳转
//     loginBtn?.addEventListener('click', () => {
//         window.location.href = '/login.html';
//     });
//
//     // Register 跳转
//     showRegister?.addEventListener('click', e => {
//         e.preventDefault();
//         window.location.href = '/register.html';
//     });
//
//     // 表单提交
//     loginForm.addEventListener('submit', async e => {
//         e.preventDefault();
//         if (step === 1) {
//             // 第一步：保存邮箱，切换到密码输入
//             savedEmail = emailInput.value.trim();
//             if (!savedEmail) {
//                 alert('Please enter a valid email.');
//                 return;
//             }
//             // 隐藏第一步元素
//             emailGroup.classList.add('hidden');
//             googleBtn.classList.add('hidden');
//             document.querySelector('.divider')?.classList.add('hidden');
//             // 展示密码输入
//             passwordGroup.classList.remove('hidden');
//             // 切换按钮文字
//             formBtn.textContent = 'Log in';
//             step = 2;
//             passwordInput.focus();
//         } else {
//             // 第二步：实际登录
//             const pwd = passwordInput.value;
//             if (!pwd) {
//                 alert('Please enter your password.');
//                 return;
//             }
//             try {
//                 await signInWithEmailAndPassword(auth, savedEmail, pwd);
//                 window.location.href = '/';
//             } catch (err: any) {
//                 alert('Login failed: ' + err.message);
//             }
//         }
//     });
// });

// login.ts
import './styles.css';
import { auth } from '@modules/firebase';
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';

window.addEventListener('DOMContentLoaded', () => {
    // —— 元素引用 —— //
    const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
    const googleBtn = document.getElementById('googleBtn') as HTMLButtonElement;
    const loginForm = document.getElementById('loginForm') as HTMLFormElement;
    const emailGroup = document.getElementById('emailGroup') as HTMLDivElement;
    const passwordGroup = document.getElementById('passwordGroup') as HTMLDivElement;
    const emailInput = document.getElementById('emailInput') as HTMLInputElement;
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
    const formBtn = document.getElementById('formBtn') as HTMLButtonElement;
    const showRegister = document.getElementById('showRegister') as HTMLAnchorElement;

    let step = 1;
    let savedEmail = '';

    // —— 顶部 “Login” 按钮跳到登录页 —— //
    loginBtn?.addEventListener('click', () => {
        window.location.href = '/login.html';
    });

    // —— “Register” 跳转 —— //
    showRegister?.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/register.html';
    });

    // —— Google 登录 —— //
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' }); // 每次都让用户选账号

    googleBtn?.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            console.log('Google 登录成功 →', result.user);
            // 登录成功后跳转首页
            window.location.href = '/';
        } catch (err: any) {
            console.error('Google 登录失败 →', err);
            alert('Google 登录失败：' + err.message);
        }
    });

    // —— 邮箱/密码两步登录 —— //
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();

        if (step === 1) {
            // 第一步：输入邮箱，切换到密码
            savedEmail = emailInput.value.trim();
            if (!savedEmail) {
                alert('Please enter a valid email.');
                return;
            }
            // 隐藏邮箱输入和 Google 按钮
            emailGroup.classList.add('hidden');
            googleBtn.classList.add('hidden');
            document.querySelector('.divider')?.classList.add('hidden');
            // 显示密码输入
            passwordGroup.classList.remove('hidden');
            // 切换按钮文字
            formBtn.textContent = 'Log in';
            passwordInput.focus();
            step = 2;

        } else {
            // 第二步：提交密码，真正登录
            const pwd = passwordInput.value;
            if (!pwd) {
                alert('Please enter your password.');
                return;
            }
            try {
                await signInWithEmailAndPassword(auth, savedEmail, pwd);
                console.log('邮箱/密码 登录成功 →', savedEmail);
                window.location.href = '/';
            } catch (err: any) {
                console.error('Email 登录失败 →', err);
                alert('Login failed: ' + err.message);
            }
        }
    });
});