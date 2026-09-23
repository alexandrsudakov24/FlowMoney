import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    query,
    startAfter,
    type DocumentData,
    type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { AdminUserRecord } from '../types';

// Opaque pagination cursor: callers pass it back to fetchUsersPage as-is
// and never look inside, so Firestore snapshot types stay in this file.
export type UsersCursor = { readonly __brand: 'UsersCursor' };

export type UsersPage = {
    users: AdminUserRecord[];
    cursor: UsersCursor | null;
    hasMore: boolean;
};

export async function fetchUsersPage(
    pageSize: number,
    after: UsersCursor | null = null,
): Promise<UsersPage> {
    const q = after
        ? query(collection(db, 'users'), limit(pageSize), startAfter(after as unknown as QueryDocumentSnapshot<DocumentData>))
        : query(collection(db, 'users'), limit(pageSize));
    const snap = await getDocs(q);
    const last = snap.docs[snap.docs.length - 1];
    return {
        users: snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AdminUserRecord, 'id'>),
        })),
        cursor: last ? (last as unknown as UsersCursor) : null,
        hasMore: snap.docs.length === pageSize,
    };
}

// Removes a user's data: the expenses and settings subcollections first
// (Firestore doesn't cascade), then the user doc itself.
export async function deleteUserData(uid: string): Promise<void> {
    const expSnap = await getDocs(collection(db, 'users', uid, 'expenses'));
    await Promise.all(expSnap.docs.map((d) => deleteDoc(d.ref)));

    const setSnap = await getDocs(collection(db, 'users', uid, 'settings'));
    await Promise.all(setSnap.docs.map((d) => deleteDoc(d.ref)));

    await deleteDoc(doc(db, 'users', uid));
}
