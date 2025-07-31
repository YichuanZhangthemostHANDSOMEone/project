// test/quiz.test.ts

import { QuizApp } from '../src/quiz';


// 修补 node 环境的 fetch
if (typeof globalThis.fetch === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    globalThis.fetch = require('node-fetch');
}
describe('QuizApp 类方法测试', () => {
    let app: QuizApp;

    beforeEach(() => {
        app = new QuizApp();
    });

    describe('shuffleArray', () => {
        it('应该正确乱序数组且不丢失元素', () => {
            const arr = [1, 2, 3, 4, 5];
            const shuffled = app.shuffleArray(arr);
            expect(shuffled).toHaveLength(arr.length);
            // 元素排序后内容应该相同
            expect(shuffled.sort()).toEqual(arr.sort());
        });

        it('应该不修改原始数组', () => {
            const arr = [1, 2, 3, 4, 5];
            const copy = arr.slice();
            app.shuffleArray(arr);
            expect(arr).toEqual(copy);
        });

        it('应该能处理空数组', () => {
            expect(app.shuffleArray([])).toEqual([]);
        });
    });

    describe('getWeek', () => {
        it('如果 URL 有 week 参数，应返回其数值', () => {
            window.history.pushState({}, '', 'http://localhost/?week=5');
            expect(app.getWeek()).toBe(5);
        });

        it('如果 URL 没有 week 参数，应返回 0', () => {
            window.history.pushState({}, '', 'http://localhost/');
            expect(app.getWeek()).toBe(0);
        });

        it('如果 URL week 参数为非数字，应返回 0', () => {
            window.history.pushState({}, '', 'http://localhost/?week=abc');
            expect(app.getWeek()).toBe(0);
        });
    });
});