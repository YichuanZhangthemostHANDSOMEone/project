// src/topics.ts

import './styles.css';
// —— 新增：引入 Firebase Auth —— //
import { auth } from '@modules/firebase';
import { signOut } from 'firebase/auth';
// —— 结束 —— //

console.log('📚 Topics page script loaded');

window.addEventListener('DOMContentLoaded', () => {
    // —— 1. Logout 按钮逻辑 —— //
    const authBtn = document.getElementById('authBtn');
    authBtn?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // 登出后清理可能的会话数据
            sessionStorage.clear();
            // 跳回登录页
            window.location.href = '/login.html';
        } catch (err: any) {
            console.error('Logout failed:', err);
            alert('Logout failed: ' + err.message);
        }
    });
    // —— Logout 逻辑结束 —— //

    // —— 2. 周次列表点击监控（可选） —— //
    const list = document.querySelectorAll<HTMLAnchorElement>('.week-list a');
    list.forEach(a => {
        a.addEventListener('click', () => {
            console.log('➡️ Jump to', a.href);
        });
    });
});