import { useEffect, useState } from 'react';
import type { DocumentReference } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import type { TranslationKeys } from '../i18n';
import { saveCategories } from '../services/categories';

export const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Home', 'Shopping', 'Health', 'Other'];

export function useCategories(
    categoriesRef: DocumentReference | null,
    showToast: (msg: string) => void,
    t: (key: TranslationKeys) => string,
) {
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

    useEffect(() => {
        if (!categoriesRef) {
            setCategories(DEFAULT_CATEGORIES);
            return;
        }
        const unsub = onSnapshot(categoriesRef, (snap) => {
            setCategories(snap.exists() ? (snap.data().list ?? DEFAULT_CATEGORIES) : DEFAULT_CATEGORIES);
        });
        return () => unsub();
    }, [categoriesRef]);

    const addCategory = async (name: string): Promise<void> => {
        if (!categoriesRef) return;
        const trimmed = name.trim();
        if (!trimmed || categories.includes(trimmed)) return;
        await saveCategories(categoriesRef, [...categories, trimmed]).catch((err) => {
            console.error('Failed to add category', err);
            showToast(t('save_error'));
        });
    };

    const removeCategory = async (name: string): Promise<boolean> => {
        if (!categoriesRef) return false;
        if (DEFAULT_CATEGORIES.includes(name)) return false;
        await saveCategories(categoriesRef, categories.filter((c) => c !== name)).catch((err) => {
            console.error('Failed to remove category', err);
            showToast(t('save_error'));
        });
        return true;
    };
    return { categories, addCategory, removeCategory };
}
