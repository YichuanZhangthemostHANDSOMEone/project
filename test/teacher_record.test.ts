/**
 * @jest-environment jsdom
 */
import {
    addTeacherRecord,
    fetchTeacherRecords,
    fetchTeacherByName,
    updateTeacherRecord,
    deleteTeacherRecord,
    TeacherRecord,
} from "../src/testable_teacher_record";

// mock @modules/firebase
jest.mock('../src/modules/firebase', () => ({
    db: {},
}));

// mock firebase/firestore 方法
const mockCollection = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
    collection: (...args: any[]) => mockCollection(...args),
    addDoc: (...args: any[]) => mockAddDoc(...args),
    getDocs: (...args: any[]) => mockGetDocs(...args),
    doc: (...args: any[]) => mockDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    query: (...args: any[]) => mockQuery(...args),
    where: (...args: any[]) => mockWhere(...args),
}));

describe('TeacherRecord CRUD', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('addTeacherRecord should add and return id', async () => {
        mockCollection.mockReturnValue('mockColRef');
        mockAddDoc.mockResolvedValue({ id: 'abc123' });

        const record: TeacherRecord = { name: 'Tom', subject: 'Math', email: 'tom@school.edu' };
        const id = await addTeacherRecord(record);

        expect(mockCollection).toHaveBeenCalledWith({}, 'teachers');
        expect(mockAddDoc).toHaveBeenCalledWith('mockColRef', record);
        expect(id).toBe('abc123');
    });

    it('fetchTeacherRecords should fetch all teacher records', async () => {
        mockCollection.mockReturnValue('mockColRef');
        mockGetDocs.mockResolvedValue({
            docs: [
                { id: '1', data: () => ({ name: 'A', subject: 'Math', email: 'a@x.com' }) },
                { id: '2', data: () => ({ name: 'B', subject: 'Eng', email: 'b@x.com' }) },
            ],
        });

        const res = await fetchTeacherRecords();
        expect(mockCollection).toHaveBeenCalledWith({}, 'teachers');
        expect(mockGetDocs).toHaveBeenCalledWith('mockColRef');
        expect(res).toEqual([
            { id: '1', name: 'A', subject: 'Math', email: 'a@x.com' },
            { id: '2', name: 'B', subject: 'Eng', email: 'b@x.com' },
        ]);
    });

    it('fetchTeacherByName returns null when no match', async () => {
        mockCollection.mockReturnValue('mockColRef');
        mockWhere.mockReturnValue('whereCond');
        mockQuery.mockReturnValue('queryObj');
        mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

        const res = await fetchTeacherByName('Jack');
        expect(res).toBeNull();
        expect(mockWhere).toHaveBeenCalledWith('name', '==', 'Jack');
    });

    it('fetchTeacherByName returns record when match found', async () => {
        mockCollection.mockReturnValue('mockColRef');
        mockWhere.mockReturnValue('whereCond');
        mockQuery.mockReturnValue('queryObj');
        mockGetDocs.mockResolvedValue({
            empty: false,
            docs: [
                { id: '3', data: () => ({ name: 'Lily', subject: 'Bio', email: 'lily@x.com' }) },
            ],
        });

        const res = await fetchTeacherByName('Lily');
        expect(res).toEqual({
            id: '3',
            name: 'Lily',
            subject: 'Bio',
            email: 'lily@x.com',
        });
        expect(mockWhere).toHaveBeenCalledWith('name', '==', 'Lily');
    });

    it('updateTeacherRecord should call updateDoc', async () => {
        mockDoc.mockReturnValue('docRef');
        mockUpdateDoc.mockResolvedValue(undefined);

        await updateTeacherRecord('id123', { subject: 'Physics' });

        expect(mockDoc).toHaveBeenCalledWith({}, 'teachers', 'id123');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { subject: 'Physics' });
    });

    it('deleteTeacherRecord should call deleteDoc', async () => {
        mockDoc.mockReturnValue('docRef');
        mockDeleteDoc.mockResolvedValue(undefined);

        await deleteTeacherRecord('id321');

        expect(mockDoc).toHaveBeenCalledWith({}, 'teachers', 'id321');
        expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });
});