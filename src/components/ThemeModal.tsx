import styles from "../styles/components/SettingsModal.module.css";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

interface ThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
    const { theme, toggle } = useTheme();
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleToggle = () => {
        toggle();
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />

            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t('theme')}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <p>{t('current_theme')}: <strong>{t(theme)}</strong></p>
                </div>

                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.primary}`} onClick={handleToggle}>
                        {t('toggle_theme')}
                    </button>
                </div>
            </div>
        </>
    );
}
