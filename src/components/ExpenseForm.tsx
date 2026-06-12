import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import styles from '../styles/components/ExpenseForm.module.css';
import type { Expense } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { currencySymbols } from '../utils/currencySymbols';

type FormData = {
    amount: string;
    category?: string;
    date: string;
    note?: string;
    type: Expense['type'];
};

export default function ExpenseForm({
    defaultValues,
    onSubmit
}: {
    defaultValues?: Partial<FormData> | Partial<Expense>;
    onSubmit: (data: FormData) => void;
}) {
    const { t } = useLanguage();
    const { currency, expenses, categories } = useApp();

    const { register, handleSubmit, setValue, watch } = useForm<FormData>({
        defaultValues: (defaultValues as Partial<FormData>) || {
            amount: '',
            category: 'Food',
            date: new Date().toISOString().slice(0, 10),
            note: '',
            type: 'expense',
        },
    });

    const type = watch('type');
    const selectedCategory = watch('category');

    useEffect(() => {
        if (defaultValues && 'type' in (defaultValues as object)) {
            setValue('type', (defaultValues as FormData).type!);
        }
    }, [defaultValues, setValue]);

    useEffect(() => {
        if (type === 'income') {
            setValue('category', '');
        } else {
            setValue('category', defaultValues?.category as string || categories[0] || 'Food');
        }
    }, [type, setValue, defaultValues, categories]);

    // Top-3 categories by usage frequency
    const topCategories = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach(e => {
            if (e.type === 'expense') map[e.category] = (map[e.category] || 0) + 1;
        });
        return [...categories]
            .sort((a, b) => (map[b] || 0) - (map[a] || 0))
            .slice(0, 3);
    }, [expenses, categories]);

    const getCatLabel = (cat: string) => {
        const key = `cat_${cat.toLowerCase()}`;
        const translated = t(key);
        return translated !== key ? translated : cat;
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.toggle} role="tablist" aria-label="Transaction type">
                <button
                    type="button"
                    className={`${styles.toggleButton} ${type === 'expense' ? styles.active : ''}`}
                    onClick={() => setValue('type', 'expense')}
                >
                    {t('expense')}
                </button>
                <button
                    type="button"
                    className={`${styles.toggleButton} ${type === 'income' ? styles.active : ''}`}
                    onClick={() => setValue('type', 'income')}
                >
                    {t('income')}
                </button>
            </div>

            <label className={styles.label}>
                <span>{t('amount')} ({currencySymbols[currency]})</span>
                <input
                    className={styles.input}
                    type="number"
                    step="0.01"
                    placeholder={`0.00 ${currencySymbols[currency]}`}
                    {...register('amount')}
                />
            </label>

            {type === 'expense' && (
                <label className={styles.label}>
                    <span>{t('category')}</span>

                    {topCategories.length > 0 && (
                        <div className={styles.chips}>
                            {topCategories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`${styles.chip} ${selectedCategory === cat ? styles.chipActive : ''}`}
                                    onClick={() => setValue('category', cat)}
                                >
                                    {getCatLabel(cat)}
                                </button>
                            ))}
                        </div>
                    )}

                    <select className={styles.select} {...register('category')}>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {getCatLabel(cat)}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <label className={styles.label}>
                <span>{t('date')}</span>
                <input className={styles.input} type="date" {...register('date')} />
            </label>

            <label className={styles.label}>
                <span>{t('notes')}</span>
                <input
                    className={styles.input}
                    type="text"
                    placeholder={t('note_placeholder')}
                    {...register('note')}
                />
            </label>

            <div className={styles.formActions}>
                <button className={styles.button} type="submit">{t('save')}</button>
            </div>
        </form>
    );
}
