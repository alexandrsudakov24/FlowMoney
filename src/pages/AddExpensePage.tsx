import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ExpenseForm } from '../components/expenses';
import type { TransactionFormData } from '../types';
import styles from './AddExpensePage.module.css';

type FormData = TransactionFormData;

const SAVED_CONFIRMATION_MS = 450;

export default function AddExpensePage() {
    const { addExpense } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [justSaved, setJustSaved] = useState(false);

    const handleSubmit = async (data: FormData) => {
        const { repeat, ...rest } = data;
        const safeAmount = Math.round(Number(data.amount) * 100) / 100;
        try {
            await addExpense({
                ...rest,
                amount: safeAmount,
                category: data.category || 'Other',
                ...(repeat === 'once' ? { scheduled: true } : {}),
                ...(repeat === 'monthly' ? { scheduled: true, repeat: 'monthly' } : {}),
            });
            setJustSaved(true);
            // Briefly show the "saved" confirmation before handing off to the
            // dashboard, where the summary numbers animate in on arrival.
            await new Promise((resolve) => setTimeout(resolve, SAVED_CONFIRMATION_MS));
            navigate('/');
        } catch {
            // error already shown via toast
        }
    };


    return (
        <div className="container">
            <div className={styles.page}>
                <h2 className="sr-only">{t('add_transaction')}</h2>
                <ExpenseForm onSubmit={handleSubmit} defaultValues={undefined} justSaved={justSaved} />
            </div>
        </div>
    );
}
