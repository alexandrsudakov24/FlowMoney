import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { saveRollover } from '../services/rollover';
import type { RolloverMode, RolloverSettings } from '../types';

const DEFAULT_ROLLOVER: RolloverSettings = { rolloverMode: 'reset' };

type RolloverStore = {
    // --- state ---
    rolloverMode: RolloverMode;

    // --- actions (called from components) ---
    updateRolloverMode: (mode: RolloverMode) => Promise<void>;

    // --- internal setup (called once from AppProvider when ref changes) ---
    _subscribe: (
        ref: DocumentReference | null,
        showToast: (msg: string) => void,
    ) => () => void;
};

export const useRolloverStore = create<RolloverStore>((set) => {
    // Plain variables — not reactive, updated on every _subscribe call
    let _ref: DocumentReference | null = null;
    let _showToast: (msg: string) => void = () => {};

    return {
        rolloverMode: DEFAULT_ROLLOVER.rolloverMode,

        // Called from AppProvider whenever the Firestore document ref changes.
        // Listens in real time and updates the rollover mode.
        _subscribe: (ref, showToast) => {
            _ref = ref;
            _showToast = showToast;

            // No ref means the user is logged out — reset to default
            if (!ref) {
                set({ rolloverMode: DEFAULT_ROLLOVER.rolloverMode });
                return () => {};
            }

            const unsub = onSnapshot(ref, (snap) => {
                set({
                    rolloverMode: snap.exists()
                        ? (snap.data() as RolloverSettings).rolloverMode
                        : DEFAULT_ROLLOVER.rolloverMode,
                });
            });

            return unsub;
        },

        updateRolloverMode: async (mode) => {
            if (!_ref) return;
            set({ rolloverMode: mode });
            await saveRollover(_ref, { rolloverMode: mode }).catch((err) => {
                console.error('Failed to save rollover mode', err);
                _showToast('save_error');
            });
        },
    };
});
