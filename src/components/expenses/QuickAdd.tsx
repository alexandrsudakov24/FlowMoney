import { useMemo, useState } from 'react';
import { useApp, INCOME_CATEGORIES } from '../../context/AppContext';
import { buildCategoryIndex, suggestCategory } from '../../utils/suggestCategory';
import ReceiptScanner from './ReceiptScanner';
import VoiceInput from './VoiceInput';
import TransactionConfirmCard, { type DraftTransaction } from './TransactionConfirmCard';
import styles from './QuickAdd.module.css';

interface Props {
    onConfirm: (draft: DraftTransaction) => Promise<void>;
    onEdit: (draft: DraftTransaction) => void;
}

// AI shortcuts above the add-transaction form: every recognised draft goes
// through the same confirmation card before anything is saved.
export default function QuickAdd({ onConfirm, onEdit }: Props) {
    const [draft, setDraft] = useState<DraftTransaction | null>(null);
    const { expenses, categories } = useApp();
    const categoryIndex = useMemo(() => buildCategoryIndex(expenses), [expenses]);

    // Where the user has filed this merchant before, trust that over the AI's
    // guess — so a category corrected once sticks for next time.
    const handleResult = (result: DraftTransaction) => {
        const allowed = result.type === 'income' ? INCOME_CATEGORIES : categories;
        const learned = suggestCategory(categoryIndex, result.note, result.type, allowed);
        setDraft(learned ? { ...result, category: learned } : result);
    };

    if (draft) {
        return (
            <div className={styles.wrap}>
                <TransactionConfirmCard
                    draft={draft}
                    onConfirm={onConfirm}
                    onEdit={(d) => { onEdit(d); setDraft(null); }}
                    onCancel={() => setDraft(null)}
                />
            </div>
        );
    }

    return (
        <div className={`${styles.wrap} ${styles.grid}`}>
            <ReceiptScanner onResult={handleResult} />
            <VoiceInput onResult={handleResult} />
        </div>
    );
}
