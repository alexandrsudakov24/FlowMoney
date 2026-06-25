import styles from './SettingsModal.module.css';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface ThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const THEME_OPTIONS: Theme[] = ['light', 'dark', 'auto'];

export default function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
    const { theme, setTheme } = useTheme();
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleSelect = (t: Theme) => {
        setTheme(t);
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
                    <div className={styles.setting}>
                        {THEME_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                className={`${styles.btn} ${theme === opt ? styles.primary : styles.secondary}`}
                                onClick={() => handleSelect(opt)}
                                style={{ marginBottom: 8 }}
                            >
                                {t(opt)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
