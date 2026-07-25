import styles from './SettingsModal.module.css';
import { useLanguage } from '../../context/LanguageContext';
import { useModalA11y } from '../../hooks/useModalA11y';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
    const { t } = useLanguage();
    const modalRef = useModalA11y(isOpen, onClose);

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label={t('about_app')} tabIndex={-1} ref={modalRef}>
                <div className={styles.header}>
                    <h2>{t('about_app')}</h2>
                </div>
                <div className={styles.content}>
                    <div className={styles.setting}>
                        <p>{t('about_app_description')}</p>
                    </div>
                    <div className={styles.setting}>
                        <span>{t('app_version')}: v{__APP_VERSION__}</span>
                    </div>
                </div>
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.primary}`} onClick={onClose}>
                        {t('close')}
                    </button>
                </div>
            </div>
        </>
    );
}
