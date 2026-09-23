import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ExpenseForm, ReceiptScanner } from '../components/expenses';
import type { ScannedReceipt } from '../components/expenses';
import type { TransactionFormData } from '../types';
import styles from './AddExpensePage.module.css';

type FormData = TransactionFormData;

const SAVED_CONFIRMATION_MS = 450;

const receiptToFormData = (receipt: ScannedReceipt): FormData => ({
    amount: String(receipt.amount),
    category: receipt.category,
    date: receipt.date,
    note: receipt.note,
    type: 'expense',
    repeat: 'none',
});

export default function AddExpensePage() {
    const { addExpense } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [justSaved, setJustSaved] = useState(false);
    // Scanned values the user chose to correct by hand; bumping the key
    // remounts the form so react-hook-form picks up the new defaults.
    const [prefill, setPrefill] = useState<{ key: number; values: FormData } | null>(null);

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
                <ReceiptScanner
                    onConfirm={(receipt) => handleSubmit(receiptToFormData(receipt))}
                    onEdit={(receipt) => setPrefill((p) => ({ key: (p?.key ?? 0) + 1, values: receiptToFormData(receipt) }))}
                />
                <ExpenseForm
                    key={prefill?.key ?? 0}
                    onSubmit={handleSubmit}
                    defaultValues={prefill?.values}
                    justSaved={justSaved}
                />
            </div>
        </div>
    );
}
