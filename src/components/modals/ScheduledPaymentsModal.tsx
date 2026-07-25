import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { ExpenseList } from '../expenses';
import { useModalA11y } from '../../hooks/useModalA11y';
import styles from './ScheduledPaymentsModal.module.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScheduledPaymentsModal({ isOpen, onClose }: Props) {
    const { scheduledExpenses } = useApp();
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
                aria-label={t('scheduled_payments')}
                tabIndex={-1}
                ref={modalRef}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>{t('scheduled_payments')}</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label={t('close')}>✕</button>
                </div>

                {scheduledExpenses.length === 0 ? (
                    <p className={styles.empty}>{t('no_scheduled_payments')}</p>
                ) : (
                    <ExpenseList expenses={scheduledExpenses} />
                )}
            </div>
        </div>
    );
}
