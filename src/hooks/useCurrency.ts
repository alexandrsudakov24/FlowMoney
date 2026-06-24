import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCurrency(userId: string | null, isAnonymous: boolean) {
    const [currency, setCurrency] = useState(
        () => localStorage.getItem('currency') || 'USD'
    );

    // Load saved currency from Firestore on sign-in
    useEffect(() => {
        if (!userId || isAnonymous) return;
        getDoc(doc(db, 'users', userId)).then((snap) => {
            const saved = snap.data()?.currency as string | undefined;
            if (saved) {
                setCurrency(saved);
                localStorage.setItem('currency', saved);
            }
        }).catch(console.warn);
    }, [userId, isAnonymous]);

    const changeCurrency = async (cur: string): Promise<void> => {
        setCurrency(cur);
        localStorage.setItem('currency', cur);
        if (userId && !isAnonymous) {
            await setDoc(doc(db, 'users', userId), { currency: cur }, { merge: true })
                .catch(console.warn);
        }
    };

    return { currency, changeCurrency };
}
