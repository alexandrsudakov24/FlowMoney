import { setDoc, type DocumentReference } from 'firebase/firestore';

export async function saveCategories(
    ref: DocumentReference,
    list: string[],
): Promise<void> {
    await setDoc(ref, { list }, { merge: true });
}

export async function saveCategoryLimits(
    ref: DocumentReference,
    limits: Record<string, number>,
): Promise<void> {
    await setDoc(ref, { limits }, { merge: true });
}
