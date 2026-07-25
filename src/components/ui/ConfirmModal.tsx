import { useLanguage } from '../../context/LanguageContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import styles from './ConfirmModal.module.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning';
    loading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    variant = 'danger',
    loading = false,
}: Props) {
    const { t } = useLanguage();
    const modalRef = useModalA11y(isOpen, onClose);

    if (!isOpen) return null;

    const icon = variant === 'danger' ? '🗑️' : '⚠️';
    const label = confirmLabel ?? (variant === 'danger' ? t('delete') : t('save'));

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={modalRef}>
                <div className={styles.handle} />
                <div className={`${styles.iconWrap} ${styles[variant]}`}>{icon}</div>
                <h2 className={styles.title}>{title}</h2>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button
                        className={`${styles.confirmBtn} ${styles[variant]}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? '…' : label}
                    </button>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </>
    );
}
