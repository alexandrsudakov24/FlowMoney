import { create } from 'zustand';
import { getAccentColorPreference, saveAccentColorPreference } from '../services/auth';

export const ACCENT_COLORS = ['purple', 'blue', 'green', 'red', 'orange', 'pink', 'teal', 'indigo', 'amber'] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

const isAccentColor = (v: string | null): v is AccentColor =>
    !!v && (ACCENT_COLORS as readonly string[]).includes(v);

type AccentColorStore = {
    // --- state ---
    accentColor: AccentColor;

    // --- actions (called from components) ---
    changeAccentColor: (color: AccentColor) => Promise<void>;

    // --- internal setup (called once from AppProvider when user changes) ---
    _init: (userId: string | null, isAnonymous: boolean) => void;
};

export const useAccentColorStore = create<AccentColorStore>((set) => {
    let _userId: string | null = null;
    let _isAnonymous = true;

    const stored = localStorage.getItem('accentColor');

    return {
        accentColor: isAccentColor(stored) ? stored : 'purple',

        _init: (userId, isAnonymous) => {
            _userId = userId;
            _isAnonymous = isAnonymous;

            if (!userId || isAnonymous) return;

            getAccentColorPreference(userId)
                .then((saved) => {
                    if (isAccentColor(saved ?? null)) {
                        set({ accentColor: saved as AccentColor });
                        localStorage.setItem('accentColor', saved!);
                    }
                })
                .catch(console.warn);
        },

        changeAccentColor: async (color) => {
            set({ accentColor: color });
            localStorage.setItem('accentColor', color);

            if (_userId && !_isAnonymous) {
                await saveAccentColorPreference(_userId, color).catch(console.warn);
            }
        },
    };
});
