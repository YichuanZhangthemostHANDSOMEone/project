// src/login.ts

import './styles.css';
// 再加载登陆页专属样式


import { auth } from '@modules/firebase';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from 'firebase/auth';
window.addEventListener('DOMContentLoaded', () => {
    // Header 上那个按钮
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/login.html';
        });
    }

    // 登录表单
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const emailInput = document.getElementById('email') as HTMLInputElement;
            const passInput  = document.getElementById('password') as HTMLInputElement;
            try {
                await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
                window.location.href = '/';
            } catch (err: any) {
                alert('Login failed: ' + err.message);
            }
        });
    }

    // “Register” 链接
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
        showRegister.addEventListener('click', e => {
            e.preventDefault();
            // 假如你后面做了单独的注册页，就跳到那
            window.location.href = '/register.html';
        });
    }

    // 如果你还打算支持 OAuth 登录，就同理再加上 googleBtn、msBtn 的 null 检查……
});