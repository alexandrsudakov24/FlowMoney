import {
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
    type CollectionReference,
    type UpdateData,
} from 'firebase/firestore';
import type { Expense } from '../types';

export async function addExpense(
    col: CollectionReference,
    data: Omit<Expense, 'id'>,
): Promise<void> {
    await addDoc(col, data);
}

export async function updateExpense(
    col: CollectionReference,
    id: string,
    data: Partial<Expense>,
): Promise<void> {
    await updateDoc(doc(col, id), data as UpdateData<Expense>);
}

export async function deleteExpense(
    col: CollectionReference,
    id: string,
): Promise<void> {
    await deleteDoc(doc(col, id));
}

export async function clearAllExpenses(col: CollectionReference): Promise<void> {
    const snap = await getDocs(col);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
