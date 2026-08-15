import {
    addDoc,
    deleteDoc,
    deleteField,
    doc,
    getDocs,
    runTransaction,
    updateDoc,
    type CollectionReference,
    type Transaction,
    type UpdateData,
} from 'firebase/firestore';
import type { Expense } from '../types';

// Advances a YYYY-MM-DD date by one calendar month, clamping to the last
// day of the target month when the original day doesn't exist there
// (e.g. Jan 31 -> Feb 28/29). JS Date normalizes month/year overflow, so
// December correctly rolls into January of the next year.
function addOneMonthClamped(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number); // m is 1-based
    const lastDayOfNextMonth = new Date(y, m + 1, 0).getDate();
    const next = new Date(y, m, Math.min(d, lastDayOfNextMonth));
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

export async function addExpense(
    col: CollectionReference,
    data: Omit<Expense, 'id'>,
): Promise<void> {
    await addDoc(col, data);
}

export async function updateExpense(
    col: CollectionReference,
    id: string,
    data: UpdateData<Expense>,
): Promise<void> {
    await updateDoc(doc(col, id), data);
}

export async function deleteExpense(
    col: CollectionReference,
    id: string,
): Promise<void> {
    await deleteDoc(doc(col, id));
}

// Fires a due scheduled payment (clones a monthly template into a real
// transaction and advances its date, or drops the flag for a one-off).
// Runs as a Firestore transaction so it re-reads the template from the
// server right before writing: in a family, two members' devices can both
// see the same template as due at once, but only the transaction that
// commits first will find it still due — the other re-reads the
// already-advanced/cleared doc and becomes a no-op instead of firing twice.
export async function fireScheduledExpense(
    col: CollectionReference,
    id: string,
    todayStr: string,
): Promise<void> {
    const templateRef = doc(col, id);
    await runTransaction(col.firestore, async (tx: Transaction) => {
        const snap = await tx.get(templateRef);
        if (!snap.exists()) return;
        const data = snap.data() as Omit<Expense, 'id'>;
        if (!data.scheduled || data.date > todayStr) return;

        if (data.repeat === 'monthly') {
            const { scheduled: _scheduled, repeat: _repeat, ...rest } = data;
            const newRef = doc(col);
            tx.set(newRef, { ...rest, createdAt: Date.now() });
            tx.update(templateRef, { date: addOneMonthClamped(data.date) });
        } else {
            tx.update(templateRef, { scheduled: deleteField() });
        }
    });
}

export async function clearAllExpenses(col: CollectionReference): Promise<void> {
    const snap = await getDocs(col);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
