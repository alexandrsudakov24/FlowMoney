import { setDoc, type DocumentReference } from 'firebase/firestore';
import type { BudgetTipsDoc } from '../types';

export async function saveBudgetTips(ref: DocumentReference, data: BudgetTipsDoc): Promise<void> {
    await setDoc(ref, data);
}
