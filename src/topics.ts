// src/topics.ts

// 引入全局样式（可选，看你是否需要）
import './styles.css';

// 让页面加载时给个日志，确认脚本被执行了
console.log('📚 Topics page script loaded');

// 如果你想给每个 <li><a> 绑定高亮或提示，这里加逻辑即可。
// 例如：标示当前周、或在点击前做校验……
window.addEventListener('DOMContentLoaded', () => {
    const list = document.querySelectorAll<HTMLAnchorElement>('.week-list a');
    list.forEach(a => {
        // 简单加个点击日志
        a.addEventListener('click', () => {
            console.log('➡️ Jump to', a.href);
        });
    });
});