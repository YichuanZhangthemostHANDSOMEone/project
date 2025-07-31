// src/quiz_service.ts
import { db } from '@modules/firebase';
import {
    collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc
} from 'firebase/firestore';

// 题目类型
export interface Quiz {
    week: number;
    id?: number; // 可选字段
    prompt: string;
    options: string[];
    correctIndex: number;
}

// 查询指定周的题目列表
export async function fetchQuestions(week: number): Promise<Quiz[]> {
    const snap = await getDocs(query(collection(db, 'questions'), where('week', '==', week)));
    return snap.docs.map((ds: any, idx: number) => {
        const data = ds.data();
        return {
            ...data,
            id: data.id ?? idx + 1,
        };
    });
}

// 新增题目（自动分配id）
export async function addQuestion(q: Omit<Quiz, 'id'>): Promise<void> {
    // 先查出同周有多少题
    const snap = await getDocs(query(collection(db, 'questions'), where('week', '==', q.week)));
    const nextId = snap.size + 1;
    await addDoc(collection(db, 'questions'), {
        ...q,
        id: nextId,
    });
}

// 更新题目（需指定doc id）
export async function updateQuestion(docId: string, q: Partial<Quiz>): Promise<void> {
    await updateDoc(doc(db, 'questions', docId), q);
}

// 删除题目（需指定doc id）
export async function deleteQuestion(docId: string): Promise<void> {
    await deleteDoc(doc(db, 'questions', docId));
}