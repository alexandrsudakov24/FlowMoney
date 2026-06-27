import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { saveCategories } from '../services/categories';

// Default categories that every user starts with and cannot delete
export const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Home', 'Shopping', 'Health', 'Other'];

type CategoryStore = {
    // --- state ---
    categories: string[];

    // --- actions (called from components) ---
    addCategory: (name: string) => Promise<void>;
    removeCategory: (name: string) => Promise<boolean>;

    // --- internal setup (called once from AppProvider when ref changes) ---
    _subscribe: (
        ref: DocumentReference | null,
        showToast: (msg: string) => void,
    ) => () => void;
};

export const useCategoryStore = create<CategoryStore>((set, get) => {
    // Plain variables — not reactive, updated on every _subscribe call
    let _ref: DocumentReference | null = null;
    let _showToast: (msg: string) => void = () => {};

    return {
        categories: DEFAULT_CATEGORIES,

        // Called from AppProvider whenever the Firestore document ref changes.
        // Listens in real time and updates the categories list.
        _subscribe: (ref, showToast) => {
            _ref = ref;
            _showToast = showToast;

            // No ref means the user is logged out — reset to defaults
            if (!ref) {
                set({ categories: DEFAULT_CATEGORIES });
                return () => {};
            }

            const unsub = onSnapshot(ref, (snap) => {
                set({
                    categories: snap.exists()
                        ? (snap.data().list ?? DEFAULT_CATEGORIES)
                        : DEFAULT_CATEGORIES,
                });
            });

            return unsub;
        },

        // Add a new custom category (skip if it already exists)
        addCategory: async (name) => {
            if (!_ref) return;
            const trimmed = name.trim();
            if (!trimmed || get().categories.includes(trimmed)) return;
            await saveCategories(_ref, [...get().categories, trimmed]).catch((err) => {
                console.error('Failed to add category', err);
                _showToast('save_error');
            });
        },

        // Remove a category — returns false if it's a default (protected) category
        removeCategory: async (name) => {
            if (!_ref) return false;
            if (DEFAULT_CATEGORIES.includes(name)) return false;
            await saveCategories(_ref, get().categories.filter((c) => c !== name)).catch((err) => {
                console.error('Failed to remove category', err);
                _showToast('save_error');
            });
            return true;
        },
    };
});
