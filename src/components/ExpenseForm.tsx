import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styles from '../styles/components/ExpenseForm.module.css';
import type { Expense } from '../services/storageService';

type FormData = {
    amount: string;
    category?: string;
    date: string;
    note?: string;
    type: Expense['type'];
};

export default function ExpenseForm({ defaultValues, onSubmit }: { defaultValues?: Partial<FormData> | Partial<Expense>; onSubmit: (data: FormData) => void }) {
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

    // ensure setValue is in sync when defaultValues change
    useEffect(() => {
        if (defaultValues && 'type' in (defaultValues as object)) {
            setValue('type', (defaultValues as FormData).type!);
        }
    }, [defaultValues, setValue]);

    // Clear category when switching to income
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
                <button type="button" className={`${styles.toggleButton} ${type === 'expense' ? styles.active : ''}`} onClick={() => setValue('type', 'expense')}>Expense</button>
                <button type="button" className={`${styles.toggleButton} ${type === 'income' ? styles.active : ''}`} onClick={() => setValue('type', 'income')}>Income</button>
            </div>

            <label className={styles.label}>
                <span>Amount ($)</span>
                <input className={styles.input} type="number" step="0.01" placeholder="Enter amount" {...register('amount')} />
            </label>

            {type === 'expense' && (
                <label className={styles.label}>
                    <span>Category</span>
                    <select className={styles.select} {...register('category')}>
                        <option>Food</option>
                        <option>Transport</option>
                        <option>Home</option>
                        <option>Shopping</option>
                        <option>Health</option>
                        <option>Other</option>
                    </select>
                </label>
            )}

            <label className={styles.label}>
                <span>Date</span>
                <input className={styles.input} type="date" {...register('date')} />
            </label>
            <label className={styles.label}>
                <span>Note</span>
                <input className={styles.input} type="text" placeholder="Add a note (optional)" {...register('note')} />
            </label>
            <div className={styles.formActions}>
                <button className={styles.button} type="submit">Save</button>
            </div>
        </form>
    );
}
