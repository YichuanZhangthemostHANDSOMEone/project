import { db } from '@modules/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// 测试用 type/interface
export interface StudentRecord {
    id?: string;
    name: string;
    age: number;
    grade: string;
}

const STUDENT_COLLECTION = 'students';

export async function fetchStudentRecords(): Promise<StudentRecord[]> {
    const col = collection(db, STUDENT_COLLECTION);
    const snapshot = await getDocs(col);
    return snapshot.docs.map((docSnap: { id: any; data: () => Omit<StudentRecord, "id">; }) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<StudentRecord, 'id'>),
    }));
}

export async function addStudentRecord(record: Omit<StudentRecord, 'id'>): Promise<string> {
    const col = collection(db, STUDENT_COLLECTION);
    const docRef = await addDoc(col, record);
    return docRef.id;
}

export async function updateStudentRecord(id: string, update: Partial<StudentRecord>): Promise<void> {
    const docRef = doc(db, STUDENT_COLLECTION, id);
    await updateDoc(docRef, update);
}

export async function deleteStudentRecord(id: string): Promise<void> {
    const docRef = doc(db, STUDENT_COLLECTION, id);
    await deleteDoc(docRef);
}

export async function fetchStudentByName(name: string): Promise<StudentRecord[]> {
    const col = collection(db, STUDENT_COLLECTION);
    const q = query(col, where('name', '==', name));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap: { id: any; data: () => Omit<StudentRecord, "id">; }) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<StudentRecord, 'id'>),
    }));
}