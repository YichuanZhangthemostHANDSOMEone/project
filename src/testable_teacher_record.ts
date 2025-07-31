import { db } from '@modules/firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    query,
    where,
    QuerySnapshot,
    DocumentData
} from 'firebase/firestore';

export interface TeacherRecord {
    id?: string;
    name: string;
    subject: string;
    email: string;
}

// 添加教师记录
export async function addTeacherRecord(record: TeacherRecord): Promise<string> {
    const colRef = collection(db, 'teachers');
    const docRef = await addDoc(colRef, record);
    return docRef.id;
}

// 获取所有教师记录
export async function fetchTeacherRecords(): Promise<TeacherRecord[]> {
    const colRef = collection(db, 'teachers');
    // @ts-ignore
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(colRef);
    return querySnapshot.docs.map((doc: { id: any; data: () => any; }) => ({
        id: doc.id,
        ...doc.data()
    })) as TeacherRecord[];
}

// 根据名字查找教师
export async function fetchTeacherByName(name: string): Promise<TeacherRecord | null> {
    const colRef = collection(db, 'teachers');
    const q = query(colRef, where('name', '==', name));
    // @ts-ignore
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    return {
        id: docSnap.id,
        ...docSnap.data()
    } as TeacherRecord;
}

// 更新教师记录
export async function updateTeacherRecord(id: string, data: Partial<TeacherRecord>): Promise<void> {
    const docRef = doc(db, 'teachers', id);
    await updateDoc(docRef, data);
}

// 删除教师记录
export async function deleteTeacherRecord(id: string): Promise<void> {
    const docRef = doc(db, 'teachers', id);
    await deleteDoc(docRef);
}