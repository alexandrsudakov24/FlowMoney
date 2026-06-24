import { useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useExpensesRef(userId: string | null, familyId: string | null, hasAccess: boolean) {
    return useMemo(() => {
        if (!hasAccess || !userId) return null;
        if (familyId) return collection(db, 'families', familyId, 'expenses');
        return collection(db, 'users', userId, 'expenses');
    }, [hasAccess, userId, familyId]);
}

export function useCategoriesRef(userId: string | null, familyId: string | null, hasAccess: boolean) {
    return useMemo(() => {
        if (!hasAccess || !userId) return null;
        if (familyId) return doc(db, 'families', familyId, 'settings', 'categories');
        return doc(db, 'users', userId, 'settings', 'categories');
    }, [hasAccess, userId, familyId]);
}
