import { setDoc, type DocumentReference } from 'firebase/firestore';
import type { RolloverSettings } from '../types';

export async function saveRollover(
    ref: DocumentReference,
    data: RolloverSettings,
): Promise<void> {
    await setDoc(ref, data);
}
