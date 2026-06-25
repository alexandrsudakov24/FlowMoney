import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function fetchUserLanguage(
    uid: string,
): Promise<'en' | 'ru' | 'he' | undefined> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists()
        ? (snap.data()?.language as 'en' | 'ru' | 'he' | undefined)
        : undefined;
}

export async function createUserProfile(
    uid: string,
    data: { name: string; email: string; language: string },
): Promise<void> {
    await setDoc(doc(db, 'users', uid), data);
}

/** Creates the profile only when it doesn't exist yet. */
export async function ensureUserProfile(
    uid: string,
    data: { name: string; email: string; language: string },
): Promise<void> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) await setDoc(doc(db, 'users', uid), data);
}

export async function updateUserLanguage(
    uid: string,
    lang: 'en' | 'ru' | 'he',
): Promise<void> {
    await setDoc(doc(db, 'users', uid), { language: lang }, { merge: true });
}

export async function getCurrencyPreference(uid: string): Promise<string | undefined> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.data()?.currency as string | undefined;
}

export async function saveCurrencyPreference(uid: string, currency: string): Promise<void> {
    await setDoc(doc(db, 'users', uid), { currency }, { merge: true });
}
