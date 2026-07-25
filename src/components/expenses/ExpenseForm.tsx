import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import styles from './ExpenseForm.module.css';
import type { Expense, TransactionFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useApp, INCOME_CATEGORIES } from '../../context/AppContext';
import { currencySymbols } from '../../constants/currency';
import { getCatLabel } from '../../utils/getCatLabel';
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator';
import { ButtonSpinner } from '../ui';

type FormData = TransactionFormData;

const TYPE_OPTIONS = ['expense', 'income'] as const;
const REPEAT_OPTIONS = ['none', 'once', 'monthly'] as const;

export default function ExpenseForm({
    defaultValues,
    onSubmit,
    justSaved = false,
}: {
    defaultValues?: Partial<FormData> | Partial<Expense>;
    onSubmit: (data: FormData) => void | Promise<void>;
    /** Shows a brief "saved" confirmation on the submit button — set true
     *  once the caller's onSubmit has resolved but before it navigates away. */
    justSaved?: boolean;
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

    const typeIndicator = useSlidingIndicator(TYPE_OPTIONS.indexOf(type));
    const repeatIndicator = useSlidingIndicator(REPEAT_OPTIONS.indexOf(repeat));

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

    const topCategories = type === 'expense' ? topExpenseCategories : topIncomeCategories;
    const categoryIndicator = useSlidingIndicator(
        topCategories.indexOf(selectedCategory ?? ''),
        [type, topCategories.join('|')]
    );

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div
                className={styles.toggle}
                role="tablist"
                aria-label={t('transaction_type')}
                ref={typeIndicator.containerRef}
            >
                {typeIndicator.rect && (
                    <span
                        className={styles.toggleIndicator}
                        style={{
                            transform: `translate(${typeIndicator.rect.left}px, ${typeIndicator.rect.top}px)`,
                            width: typeIndicator.rect.width,
                            height: typeIndicator.rect.height,
                        }}
                    />
                )}
                {TYPE_OPTIONS.map((opt, i) => (
                    <button
                        key={opt}
                        type="button"
                        className={`${styles.toggleButton} ${type === opt ? styles.active : ''}`}
                        onClick={() => setValue('type', opt)}
                        ref={(el) => { typeIndicator.itemRefs.current[i] = el; }}
                    >
                        {t(opt)}
                    </button>
                ))}
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
                {topCategories.length > 0 && (
                    <div className={styles.chips} ref={categoryIndicator.containerRef}>
                        {categoryIndicator.rect && (
                            <span
                                className={styles.chipIndicator}
                                style={{
                                    transform: `translate(${categoryIndicator.rect.left}px, ${categoryIndicator.rect.top}px)`,
                                    width: categoryIndicator.rect.width,
                                    height: categoryIndicator.rect.height,
                                }}
                            />
                        )}
                        {topCategories.map((cat, i) => (
                            <button
                                key={cat}
                                type="button"
                                className={`${styles.chip} ${selectedCategory === cat ? styles.chipActive : ''}`}
                                onClick={() => setValue('category', cat)}
                                ref={(el) => { categoryIndicator.itemRefs.current[i] = el; }}
                            >
                                {getCatLabel(cat, t)}
                            </button>
                        ))}
                    </div>
                )}
                <select className={styles.select} {...register('category')}>
                    {(type === 'expense' ? categories : INCOME_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{getCatLabel(cat, t)}</option>
                    ))}
                </select>
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
                <div
                    className={styles.toggle}
                    role="tablist"
                    aria-label={t('repeat')}
                    ref={repeatIndicator.containerRef}
                >
                    {repeatIndicator.rect && (
                        <span
                            className={styles.toggleIndicator}
                            style={{
                                transform: `translate(${repeatIndicator.rect.left}px, ${repeatIndicator.rect.top}px)`,
                                width: repeatIndicator.rect.width,
                                height: repeatIndicator.rect.height,
                            }}
                        />
                    )}
                    {REPEAT_OPTIONS.map((opt, i) => (
                        <button
                            key={opt}
                            type="button"
                            className={`${styles.toggleButton} ${repeat === opt ? styles.active : ''}`}
                            onClick={() => setValue('repeat', opt)}
                            ref={(el) => { repeatIndicator.itemRefs.current[i] = el; }}
                        >
                            {t(opt === 'none' ? 'repeat_none' : opt === 'once' ? 'repeat_once' : 'repeat_monthly')}
                        </button>
                    ))}
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
                <button
                    className={`${styles.button} ${justSaved ? styles.buttonSuccess : ''}`}
                    type="submit"
                    disabled={isSubmitting || justSaved}
                >
                    {justSaved ? (
                        <span className={styles.buttonSuccessContent}>✓ {t('saved')}</span>
                    ) : isSubmitting ? (
                        <span className={styles.buttonSuccessContent}><ButtonSpinner /> {t('saving')}</span>
                    ) : t('save')}
                </button>
            </div>
        </form>
    );
}
