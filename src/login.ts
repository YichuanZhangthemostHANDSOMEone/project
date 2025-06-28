// src/login.ts
import { auth } from '@modules/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    onAuthStateChanged
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
const msProvider     = new OAuthProvider('microsoft.com');

window.addEventListener('DOMContentLoaded', () => {
    const loginBtn        = document.getElementById('loginBtn')! as HTMLButtonElement;
    const loginForm       = document.getElementById('loginForm')! as HTMLFormElement;
    const registerForm    = document.getElementById('registerForm')! as HTMLFormElement;
    const showRegister    = document.getElementById('showRegister')! as HTMLAnchorElement;
    const showLogin       = document.getElementById('showLogin')! as HTMLAnchorElement;
    const googleBtn       = document.getElementById('googleBtn')! as HTMLButtonElement;
    const msBtn           = document.getElementById('msBtn')! as HTMLButtonElement;

    // 如果已登录，跳回首页
    onAuthStateChanged(auth, (user: any) => {
        if (user) {
            window.location.href = '/';
        }
    });

    // 切换到注册表单
    showRegister.addEventListener('click', e => {
        e.preventDefault();
        loginForm.style.display    = 'none';
        registerForm.style.display = 'block';
    });

    // 切换到登录表单
    showLogin.addEventListener('click', e => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display    = 'block';
    });

    // 提交登录
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email    = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = '/';
        } catch (err: any) {
            alert('Login failed: ' + err.message);
        }
    });

    // 提交注册
    registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email    = (document.getElementById('regEmail') as HTMLInputElement).value;
        const pwd      = (document.getElementById('regPassword') as HTMLInputElement).value;
        const confirm  = (document.getElementById('confirmPassword') as HTMLInputElement).value;
        if (pwd !== confirm) {
            return alert('Passwords do not match');
        }
        try {
            await createUserWithEmailAndPassword(auth, email, pwd);
            window.location.href = '/';
        } catch (err: any) {
            alert('Registration failed: ' + err.message);
        }
    });

    // Google 登录
    googleBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            window.location.href = '/';
        } catch (err: any) {
            alert('Google sign-in failed: ' + err.message);
        }
    });

    // Outlook (Microsoft) 登录
    msBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, msProvider);
            window.location.href = '/';
        } catch (err: any) {
            alert('Microsoft sign-in failed: ' + err.message);
        }
    });

    // header 上的登录按钮也跳到 login 页面
    loginBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
    });
});