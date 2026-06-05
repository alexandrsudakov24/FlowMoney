import { useForm } from 'react-hook-form';

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
        <form onSubmit={handleSubmit(onSubmit)}>
            <input type="number" step="0.01" placeholder="Amount" {...register('amount')} />
            <select {...register('category')}>
                <option>Food</option>
                <option>Transport</option>
                <option>Home</option>
                <option>Shopping</option>
                <option>Health</option>
                <option>Other</option>
            </select>
            <input type="date" {...register('date')} />
            <input type="text" placeholder="Note" {...register('note')} />
            <button type="submit">Save</button>
        </form>
    );
}
