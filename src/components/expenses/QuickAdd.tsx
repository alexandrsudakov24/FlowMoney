import { useState } from 'react';
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
            <ReceiptScanner onResult={setDraft} />
            <VoiceInput onResult={setDraft} />
        </div>
    );
}
