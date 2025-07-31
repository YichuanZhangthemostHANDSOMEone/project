/**
 * @jest-environment jsdom
 */
import {
    fetchStudentRecords,
    addStudentRecord,
    updateStudentRecord,
    deleteStudentRecord,
    fetchStudentByName,
    StudentRecord
} from '../src/testable_student_record';

// mock firebase
jest.mock('@modules/firebase', () => ({
    db: {}
}));



const mockCollection = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
    collection: (...args: any[]) => mockCollection(...args),
    addDoc: (...args: any[]) => mockAddDoc(...args),
    getDocs: (...args: any[]) => mockGetDocs(...args),
    doc: (...args: any[]) => mockDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    query: (...args: any[]) => mockQuery(...args),
    where: (...args: any[]) => mockWhere(...args),
}));

describe('Student Record Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetchStudentRecords works', async () => {
        const fakeDocs = [
            { id: '1', data: () => ({ name: 'Alice', age: 20, grade: 'A' }) },
            { id: '2', data: () => ({ name: 'Bob', age: 21, grade: 'B' }) }
        ];
        mockGetDocs.mockResolvedValueOnce({ docs: fakeDocs });
        const records = await fetchStudentRecords();
        expect(mockCollection).toHaveBeenCalled();
        expect(mockGetDocs).toHaveBeenCalled();
        expect(records).toEqual([
            { id: '1', name: 'Alice', age: 20, grade: 'A' },
            { id: '2', name: 'Bob', age: 21, grade: 'B' }
        ]);
    });

    it('addStudentRecord works', async () => {
        mockAddDoc.mockResolvedValueOnce({ id: 'newid' });
        const id = await addStudentRecord({ name: 'C', age: 22, grade: 'C' });
        expect(mockAddDoc).toHaveBeenCalled();
        expect(id).toBe('newid');
    });

    it('updateStudentRecord works', async () => {
        mockUpdateDoc.mockResolvedValueOnce(undefined);
        await updateStudentRecord('uid', { grade: 'A+' });
        expect(mockDoc).toHaveBeenCalledWith({}, 'students', 'uid');
        expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('deleteStudentRecord works', async () => {
        mockDeleteDoc.mockResolvedValueOnce(undefined);
        await deleteStudentRecord('uid');
        expect(mockDoc).toHaveBeenCalledWith({}, 'students', 'uid');
        expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('fetchStudentByName works', async () => {
        const fakeDocs = [
            { id: '3', data: () => ({ name: 'Daisy', age: 19, grade: 'B+' }) }
        ];
        mockGetDocs.mockResolvedValueOnce({ docs: fakeDocs });
        mockQuery.mockReturnValue('mock-query');
        mockWhere.mockReturnValue('mock-where');
        const records = await fetchStudentByName('Daisy');
        expect(mockCollection).toHaveBeenCalled();
        expect(mockWhere).toHaveBeenCalledWith('name', '==', 'Daisy');
        expect(mockQuery).toHaveBeenCalled();
        expect(records).toEqual([
            { id: '3', name: 'Daisy', age: 19, grade: 'B+' }
        ]);
    });
});