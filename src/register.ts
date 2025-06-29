// src/register.ts

import './styles.css';

import { auth } from '@modules/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

window.addEventListener('DOMContentLoaded', () => {
    // Header 上 “Login” 按钮
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/login.html';
        });
    }

    // “Already have an account? Login” 链接
    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
        showLogin.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = '/login.html';
        });
    }

    // 注册表单
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async e => {
            e.preventDefault();
            const emailInput = document.getElementById('email') as HTMLInputElement;
            const passInput = document.getElementById('password') as HTMLInputElement;

            try {
                await createUserWithEmailAndPassword(
                    auth,
                    emailInput.value,
                    passInput.value
                );
                // 注册成功后自动跳回登录页
                window.location.href = '/login.html';
            } catch (err: any) {
                alert('Registration failed: ' + err.message);
            }
        });
    }
});