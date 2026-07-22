import { setDoc, type DocumentReference } from 'firebase/firestore';
import type { InsightsDoc } from '../types';

export async function saveInsights(ref: DocumentReference, data: InsightsDoc): Promise<void> {
    await setDoc(ref, data);
}
