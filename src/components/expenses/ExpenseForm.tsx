import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import styles from './ExpenseForm.module.css';
import type { Expense, TransactionFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useApp, INCOME_CATEGORIES } from '../../context/AppContext';
import { currencySymbols } from '../../constants/currency';
import { getCatLabel } from '../../utils/getCatLabel';

type FormData = TransactionFormData;

export default function ExpenseForm({
    defaultValues,
    onSubmit
}: {
    defaultValues?: Partial<FormData> | Partial<Expense>;
    onSubmit: (data: FormData) => void | Promise<void>;
}) {
    const { t } = useLanguage();
    const { currency, expenses, categories } = useApp();

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
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
    const repeat = watch('repeat') || 'none';
    const todayStr = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        if (defaultValues && 'type' in (defaultValues as object)) {
            setValue('type', (defaultValues as FormData).type!);
        }
    }, [defaultValues, setValue]);

    const defaultCategory = defaultValues?.category;

    useEffect(() => {
        if (defaultCategory) return;
        setValue('category', type === 'income' ? INCOME_CATEGORIES[0] : categories[0] || 'Food');
    }, [type, defaultCategory, setValue, categories]);

    const topExpenseCategories = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach(e => {
            if (e.type === 'expense') map[e.category] = (map[e.category] || 0) + 1;
        });
        return [...categories].sort((a, b) => (map[b] || 0) - (map[a] || 0)).slice(0, 3);
    }, [expenses, categories]);

    const topIncomeCategories = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach(e => {
            if (e.type === 'income') map[e.category] = (map[e.category] || 0) + 1;
        });
        return [...INCOME_CATEGORIES].sort((a, b) => (map[b] || 0) - (map[a] || 0)).slice(0, 3);
    }, [expenses]);

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.toggle} role="tablist" aria-label={t('transaction_type')}>
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
                    className={`${styles.input} ${errors.amount ? styles.inputError : ''}`}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder={`0.00 ${currencySymbols[currency]}`}
                    {...register('amount', { required: true, validate: (v) => Number(v) > 0 })}
                />
                {errors.amount && <span className={styles.errorMsg}>{t('amount_required')}</span>}
            </label>

            <label className={styles.label}>
                <span>{t('category')}</span>
                {type === 'expense' ? (
                    <>
                        {topExpenseCategories.length > 0 && (
                            <div className={styles.chips}>
                                {topExpenseCategories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        className={`${styles.chip} ${selectedCategory === cat ? styles.chipActive : ''}`}
                                        onClick={() => setValue('category', cat)}
                                    >
                                        {getCatLabel(cat, t)}
                                    </button>
                                ))}
                            </div>
                        )}
                        <select className={styles.select} {...register('category')}>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{getCatLabel(cat, t)}</option>
                            ))}
                        </select>
                    </>
                ) : (
                    <>
                        <div className={styles.chips}>
                            {topIncomeCategories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`${styles.chip} ${selectedCategory === cat ? styles.chipActive : ''}`}
                                    onClick={() => setValue('category', cat)}
                                >
                                    {getCatLabel(cat, t)}
                                </button>
                            ))}
                        </div>
                        <select className={styles.select} {...register('category')}>
                            {INCOME_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{getCatLabel(cat, t)}</option>
                            ))}
                        </select>
                    </>
                )}
            </label>

            <label className={styles.label}>
                <span>{t('date')}</span>
                <input
                    className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                    type="date"
                    {...register('date', {
                        validate: (v) => repeat !== 'once' || v > todayStr || t('schedule_date_future_required'),
                    })}
                />
                {errors.date && <span className={styles.errorMsg}>{errors.date.message}</span>}
            </label>

            <label className={styles.label}>
                <span>{t('repeat')}</span>
                <div className={styles.toggle} role="tablist" aria-label={t('repeat')}>
                    <button
                        type="button"
                        className={`${styles.toggleButton} ${repeat === 'none' ? styles.active : ''}`}
                        onClick={() => setValue('repeat', 'none')}
                    >
                        {t('repeat_none')}
                    </button>
                    <button
                        type="button"
                        className={`${styles.toggleButton} ${repeat === 'once' ? styles.active : ''}`}
                        onClick={() => setValue('repeat', 'once')}
                    >
                        {t('repeat_once')}
                    </button>
                    <button
                        type="button"
                        className={`${styles.toggleButton} ${repeat === 'monthly' ? styles.active : ''}`}
                        onClick={() => setValue('repeat', 'monthly')}
                    >
                        {t('repeat_monthly')}
                    </button>
                </div>
            </label>
            {repeat !== 'none' && (
                <p className={styles.hint}>
                    {repeat === 'monthly' ? t('repeat_monthly_hint') : t('schedule_later_hint')}
                </p>
            )}

            <label className={styles.label}>
                <span>{t('notes')}</span>
                <input
                    className={styles.input}
                    type="text"
                    placeholder={t('note_placeholder')}
                    {...register('note', { maxLength: 200 })}
                    maxLength={200}
                />
            </label>

            <div className={styles.formActions}>
                <button className={styles.button} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('saving') : t('save')}
                </button>
            </div>
        </form>
    );
}
