import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { currencySymbols } from '../../constants/currency';
import { getCatLabel } from '../../utils/getCatLabel';
import type { ParsedTransaction } from '../../services/gemini';
import { ButtonSpinner } from '../ui';
import styles from './TransactionConfirmCard.module.css';

/** A transaction recognised by AI (receipt photo, voice), not yet saved. */
export type DraftTransaction = Omit<ParsedTransaction, 'isTransaction'>;

interface Props {
    draft: DraftTransaction;
    /** Saves the draft as-is. */
    onConfirm: (draft: DraftTransaction) => Promise<void>;
    /** Hands the draft to the form for manual correction. */
    onEdit: (draft: DraftTransaction) => void;
    onCancel: () => void;
}

// Spells out exactly what an AI-recognised transaction will add, so nothing
// is saved without the user seeing it first.
export default function TransactionConfirmCard({ draft, onConfirm, onEdit, onCancel }: Props) {
    const { t } = useLanguage();
    const { currency } = useApp();
    const [saving, setSaving] = useState(false);
    const isIncome = draft.type === 'income';
    const title = isIncome ? t('draft_will_add_income') : t('draft_will_add_expense');

    const handleConfirm = async () => {
        setSaving(true);
        try {
            await onConfirm(draft);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.card} role="dialog" aria-label={title}>
            <p className={styles.cardTitle}>{title}</p>
            <p className={`${styles.amount} ${isIncome ? styles.income : styles.expense}`}>
                {isIncome ? '+' : '−'}{draft.amount.toFixed(2)} {currencySymbols[currency]}
            </p>
            <dl className={styles.details}>
                <dt>{t('category')}</dt>
                <dd>{getCatLabel(draft.category, t)}</dd>
                <dt>{t('date')}</dt>
                <dd>{draft.date}</dd>
                {draft.note && (
                    <>
                        <dt>{t('notes')}</dt>
                        <dd>{draft.note}</dd>
                    </>
                )}
            </dl>
            <div className={styles.actions}>
                <button type="button" className={styles.confirm} onClick={handleConfirm} disabled={saving}>
                    {saving ? <><ButtonSpinner /> {t('saving')}</> : t('draft_add')}
                </button>
                <button type="button" className={styles.secondary} onClick={() => onEdit(draft)} disabled={saving}>
                    {t('draft_edit')}
                </button>
                <button type="button" className={styles.secondary} onClick={onCancel} disabled={saving}>
                    {t('cancel')}
                </button>
            </div>
        </div>
    );
}
