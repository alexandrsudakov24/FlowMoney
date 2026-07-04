import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { ExpenseList } from '../expenses';
import styles from './ScheduledPaymentsModal.module.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScheduledPaymentsModal({ isOpen, onClose }: Props) {
    const { scheduledExpenses } = useApp();
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{t('scheduled_payments')}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
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
