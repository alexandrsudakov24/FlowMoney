import { useLanguage } from '../../context/LanguageContext';
import { ExpenseList } from '../expenses';
import { useModalA11y } from '../../hooks/useModalA11y';
import type { Expense } from '../../types';
import styles from './TransactionsModal.module.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    expenses: Expense[];
}

export default function TransactionsModal({ isOpen, onClose, title, expenses }: Props) {
    const { t } = useLanguage();
    const modalRef = useModalA11y(isOpen, onClose);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                ref={modalRef}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label={t('close')}>✕</button>
                </div>

                <ExpenseList expenses={expenses} />
            </div>
        </div>
    );
}
