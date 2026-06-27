import { create } from 'zustand';
import { getCurrencyPreference, saveCurrencyPreference } from '../services/auth';

type CurrencyStore = {
    // --- state ---
    currency: string;

    // --- actions (called from components) ---
    changeCurrency: (cur: string) => Promise<void>;

    // --- internal setup (called once from AppProvider when user changes) ---
    _init: (userId: string | null, isAnonymous: boolean) => void;
};

export const useCurrencyStore = create<CurrencyStore>((set) => {
    // Plain variables — not reactive, no re-renders when they change
    let _userId: string | null = null;
    let _isAnonymous = true;

    return {
        // Read from localStorage on first load, fall back to USD
        currency: localStorage.getItem('currency') || 'USD',

        // Called from AppProvider whenever the user changes (login, logout, etc.)
        // Loads the saved currency from Firestore for logged-in users
        _init: (userId, isAnonymous) => {
            _userId = userId;
            _isAnonymous = isAnonymous;

            // Guests and logged-out users just use localStorage
            if (!userId || isAnonymous) return;

            getCurrencyPreference(userId)
                .then((saved) => {
                    if (saved) {
                        set({ currency: saved });
                        localStorage.setItem('currency', saved);
                    }
                })
                .catch(console.warn);
        },

        // Save the new currency to localStorage and Firestore (for logged-in users)
        changeCurrency: async (cur) => {
            set({ currency: cur });
            localStorage.setItem('currency', cur);

            if (_userId && !_isAnonymous) {
                await saveCurrencyPreference(_userId, cur).catch(console.warn);
            }
        },
    };
});
