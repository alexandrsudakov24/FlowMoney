import { useState } from 'react';
import styles from './SettingsModal.module.css';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { sendFeedback } from '../../services/feedback';
import { useModalA11y } from '../../hooks/useModalA11y';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const modalRef = useModalA11y(isOpen, onClose);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!user || !message.trim()) return;
        setSending(true);
        try {
            await sendFeedback(user, message.trim());
            showToast(t('feedback_sent'), 'success');
            setMessage('');
            onClose();
        } catch {
            showToast(t('save_error'));
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label={t('contact_developer')} tabIndex={-1} ref={modalRef}>
                <div className={styles.header}>
                    <h2>{t('contact_developer')}</h2>
                </div>
                <div className={styles.content}>
                    <div className={styles.setting}>
                        <textarea
                            className={styles.textarea}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('feedback_placeholder')}
                            rows={5}
                            maxLength={2000}
                        />
                    </div>
                </div>
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.cancel}`} onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button
                        className={`${styles.btn} ${styles.save}`}
                        onClick={handleSend}
                        disabled={sending || !message.trim()}
                    >
                        {sending ? t('saving') : t('send')}
                    </button>
                </div>
            </div>
        </>
    );
}
