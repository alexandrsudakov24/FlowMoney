import { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
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

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const icon = variant === 'danger' ? '🗑️' : '⚠️';
    const label = confirmLabel ?? (variant === 'danger' ? t('delete') : t('save'));

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal} role="dialog" aria-modal="true">
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
