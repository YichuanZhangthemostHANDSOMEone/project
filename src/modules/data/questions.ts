// 每个 week 下包含5道题的静态示例
export interface Question {
    id: number;
    prompt: string;
    options: string[];
}

export const questionsByWeek: Record<number, Question[]> = {
    1: [
        { id: 1, prompt: 'Which of the OSI layers deals with the shape of connectors for network connections?', options: ['Physical', 'Data link', 'Network', 'Transport'] },
        { id: 2, prompt: 'What layer does the TCP/IP Secure Sockets Layer map to in the OSI network model?', options: ['Secure Data Link Layer', 'Secure Network Layer', 'Secure Transport Layer', 'Session and Presentation Layers'] },
        // ... 共 5 题
    ],
    // 2: [...],
    // ... week 3-10
};