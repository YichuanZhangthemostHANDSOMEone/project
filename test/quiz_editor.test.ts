/**
 * @jest-environment jsdom
 */
import {
    fetchQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    Quiz
} from '../src/quiz_editor_t1_service';

// mock firebase
jest.mock('@modules/firebase', () => ({
    db: {}
}));

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

describe('quiz_service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('fetchQuestions fetches and parses questions', async () => {
        const fakeDocs = [
            {
                data: () => ({
                    prompt: 'What is 2+2?',
                    options: ['1', '2', '4'],
                    correctIndex: 2
                })
            },
            {
                data: () => ({
                    prompt: 'What is the capital of France?',
                    options: ['Paris', 'London', 'Berlin'],
                    correctIndex: 0
                })
            }
        ];
        mockCollection.mockReturnValue('questionsCol');
        mockWhere.mockReturnValue('whereCond');
        mockQuery.mockReturnValue('finalQuery');
        mockGetDocs.mockResolvedValue({
            docs: fakeDocs
        });

        const qs = await fetchQuestions(1);
        expect(mockCollection).toHaveBeenCalledWith({}, 'questions');
        expect(mockWhere).toHaveBeenCalledWith('week', '==', 1);
        expect(mockQuery).toHaveBeenCalledWith('questionsCol', 'whereCond');
        expect(mockGetDocs).toHaveBeenCalledWith('finalQuery');
        expect(qs.length).toBe(2);
        expect(qs[0].prompt).toBe('What is 2+2?');
        expect(qs[1].options[0]).toBe('Paris');
    });

    test('addQuestion adds a new question with nextId', async () => {
        mockCollection.mockReturnValue('questionsCol');
        mockWhere.mockReturnValue('whereCond');
        mockQuery.mockReturnValue('finalQuery');
        mockGetDocs.mockResolvedValue({ size: 1 }); // 已有1题
        mockAddDoc.mockResolvedValue(undefined);

        const q: Omit<Quiz, 'id'> = {
            week: 2,
            prompt: 'test',
            options: ['a', 'b', 'c'],
            correctIndex: 0
        };
        await addQuestion(q);
        expect(mockGetDocs).toHaveBeenCalled();
        expect(mockAddDoc).toHaveBeenCalledWith('questionsCol', {
            ...q,
            id: 2
        });
    });

    test('updateQuestion updates a question', async () => {
        mockDoc.mockReturnValue('docRef');
        mockUpdateDoc.mockResolvedValue(undefined);

        await updateQuestion('id123', { prompt: 'changed' });
        expect(mockDoc).toHaveBeenCalledWith({}, 'questions', 'id123');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { prompt: 'changed' });
    });

    test('deleteQuestion deletes a question', async () => {
        mockDoc.mockReturnValue('docRef');
        mockDeleteDoc.mockResolvedValue(undefined);

        await deleteQuestion('id123');
        expect(mockDoc).toHaveBeenCalledWith({}, 'questions', 'id123');
        expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });
});
