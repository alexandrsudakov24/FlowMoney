import { useEffect, useState } from 'react';
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
    const [selected, setSelected] = useState<Theme>(theme);

    // Reset the pending selection to the applied theme each time the modal opens
    useEffect(() => {
        if (isOpen) setSelected(theme);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        setTheme(selected);
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t('theme')}</h2>
                </div>
                <div className={styles.content}>
                    <div className={styles.setting}>
                        {THEME_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                className={`${styles.btn} ${selected === opt ? styles.primary : styles.secondary}`}
                                onClick={() => setSelected(opt)}
                                style={{ marginBottom: 8 }}
                            >
                                {t(opt)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.secondary}`} onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button className={`${styles.btn} ${styles.primary}`} onClick={handleSave}>
                        {t('save')}
                    </button>
                </div>
            </div>
        </>
    );
}
