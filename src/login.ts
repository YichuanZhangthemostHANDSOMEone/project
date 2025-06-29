import './styles.css';
import { auth } from '@modules/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

window.addEventListener('DOMContentLoaded', () => {
    // 元素引用
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

    // 顶部 Login 按钮跳转
    loginBtn?.addEventListener('click', () => {
        window.location.href = '/login.html';
    });

    // Register 跳转
    showRegister?.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/register.html';
    });

    // 表单提交
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (step === 1) {
            // 第一步：保存邮箱，切换到密码输入
            savedEmail = emailInput.value.trim();
            if (!savedEmail) {
                alert('Please enter a valid email.');
                return;
            }
            // 隐藏第一步元素
            emailGroup.classList.add('hidden');
            googleBtn.classList.add('hidden');
            document.querySelector('.divider')?.classList.add('hidden');
            // 展示密码输入
            passwordGroup.classList.remove('hidden');
            // 切换按钮文字
            formBtn.textContent = 'Log in';
            step = 2;
            passwordInput.focus();
        } else {
            // 第二步：实际登录
            const pwd = passwordInput.value;
            if (!pwd) {
                alert('Please enter your password.');
                return;
            }
            try {
                await signInWithEmailAndPassword(auth, savedEmail, pwd);
                window.location.href = '/';
            } catch (err: any) {
                alert('Login failed: ' + err.message);
            }
        }
    });
});