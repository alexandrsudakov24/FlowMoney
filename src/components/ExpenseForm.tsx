import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styles from '../styles/components/ExpenseForm.module.css';
import type { Expense } from '../services/storageService';
import { useLanguage } from '../context/LanguageContext';

type FormData = {
    amount: string;
    category?: string;
    date: string;
    note?: string;
    type: Expense['type'];
};

export default function ExpenseForm({ defaultValues, onSubmit }: { defaultValues?: Partial<FormData> | Partial<Expense>; onSubmit: (data: FormData) => void }) {
    const { t } = useLanguage();

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

    useEffect(() => {
        if (defaultValues && 'type' in (defaultValues as object)) {
            setValue('type', (defaultValues as FormData).type!);
        }
    }, [defaultValues, setValue]);

    useEffect(() => {
        if (type === 'income') {
            setValue('category', '');
        } else {
            setValue('category', defaultValues?.category as string || 'Food');
        }
    }, [type, setValue, defaultValues]);

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
                <span>{t('amount')} ($)</span>
                <input
                    className={styles.input}
                    type="number"
                    step="0.01"
                    placeholder={t('amount_placeholder')}
                    {...register('amount')}
                />
            </label>

            {type === 'expense' && (
                <label className={styles.label}>
                    <span>{t('category')}</span>
                    <select className={styles.select} {...register('category')}>
                        <option value="Food">{t('cat_food')}</option>
                        <option value="Transport">{t('cat_transport')}</option>
                        <option value="Home">{t('cat_home')}</option>
                        <option value="Shopping">{t('cat_shopping')}</option>
                        <option value="Health">{t('cat_health')}</option>
                        <option value="Other">{t('cat_other')}</option>
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
