import { setDoc, type DocumentReference } from 'firebase/firestore';

export async function saveCategories(
    ref: DocumentReference,
    list: string[],
): Promise<void> {
    await setDoc(ref, { list });
}
