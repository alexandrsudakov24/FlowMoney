import { useEffect, useState } from 'react';
import { getCurrencyPreference, saveCurrencyPreference } from '../services/auth';

export function useCurrency(userId: string | null, isAnonymous: boolean) {
    const [currency, setCurrency] = useState(
        () => localStorage.getItem('currency') || 'USD',
    );

    // Load saved currency from Firestore on sign-in
    useEffect(() => {
        if (!userId || isAnonymous) return;
        getCurrencyPreference(userId).then((saved) => {
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
            await saveCurrencyPreference(userId, cur).catch(console.warn);
        }
    };

    return { currency, changeCurrency };
}
