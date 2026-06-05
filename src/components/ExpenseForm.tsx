import { useForm } from 'react-hook-form';
import styles from './ExpenseForm.module.css';

export default function ExpenseForm({ defaultValues, onSubmit }) {
    const { register, handleSubmit } = useForm({
        defaultValues: defaultValues || {
            amount: '',
            category: 'Food',
            date: new Date().toISOString().slice(0, 10),
            note: '',
        },
    });

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <label className={styles.label}>
                <span>Amount ($)</span>
                <input className={styles.input} type="number" step="0.01" placeholder="Enter amount" {...register('amount')} />
            </label>
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
            <label className={styles.label}>
                <span>Date</span>
                <input className={styles.input} type="date" {...register('date')} />
            </label>
            <label className={styles.label}>
                <span>Note</span>
                <input className={styles.input} type="text" placeholder="Add a note (optional)" {...register('note')} />
            </label>
            <div className={styles.formActions}>
                <button className={styles.button} type="submit">💾 Save Expense</button>
            </div>
        </form>
    );
}
