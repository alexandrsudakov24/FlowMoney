import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeMember } from '../services/family';
import type { Family } from '../types';

const { mockUpdate, mockCommit, mockBatch, mockDoc, mockArrayRemove, mockDeleteField } = vi.hoisted(() => {
    const mockUpdate = vi.fn();
    const mockCommit = vi.fn().mockResolvedValue(undefined);
    const mockBatch = vi.fn(() => ({ update: mockUpdate, commit: mockCommit }));
    const mockDoc = vi.fn((_db: unknown, ...parts: string[]) => ({ path: parts.join('/') }));
    const mockArrayRemove = vi.fn((...args: unknown[]) => ({ __op: 'arrayRemove', args }));
    const mockDeleteField = vi.fn(() => ({ __op: 'deleteField' }));
    return { mockUpdate, mockCommit, mockBatch, mockDoc, mockArrayRemove, mockDeleteField };
});

vi.mock('../firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
    doc: mockDoc,
    writeBatch: mockBatch,
    arrayRemove: mockArrayRemove,
    deleteField: mockDeleteField,
    // Unused by removeMember but imported by the module — harmless stubs
    addDoc: vi.fn(),
    arrayUnion: vi.fn(),
    collection: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn(),
}));

describe('services/family — removeMember', () => {
    beforeEach(() => vi.clearAllMocks());

    const family: Family = {
        id: 'fam-1',
        name: 'Test Family',
        ownerId: 'owner-1',
        members: [
            { uid: 'owner-1', email: 'owner@test.com', name: 'Owner' },
            { uid: 'member-2', email: 'member2@test.com', name: 'Member Two' },
        ],
    };

    it('removes the target member from the family doc and clears their familyId pointer', async () => {
        await removeMember(family, 'member-2');

        expect(mockCommit).toHaveBeenCalledOnce();
        expect(mockArrayRemove).toHaveBeenCalledWith(family.members[1]);
        expect(mockUpdate).toHaveBeenCalledWith(
            { path: 'families/fam-1' },
            { members: expect.objectContaining({ __op: 'arrayRemove' }) },
        );
        expect(mockUpdate).toHaveBeenCalledWith(
            { path: 'users/member-2' },
            { familyId: expect.objectContaining({ __op: 'deleteField' }) },
        );
    });

    it('does nothing if the target uid is not a member', async () => {
        await removeMember(family, 'not-a-member');

        expect(mockCommit).not.toHaveBeenCalled();
        expect(mockUpdate).not.toHaveBeenCalled();
    });
});
