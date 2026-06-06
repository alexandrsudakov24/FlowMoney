import { useState } from 'react';
import styles from '../styles/components/SettingsModal.module.css';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { theme, toggle } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [tempTheme, setTempTheme] = useState(theme);
    const [tempLanguage, setTempLanguage] = useState(language);

    const handleSave = () => {
        if (tempTheme !== theme) {
            toggle();
        }
        if (tempLanguage !== language) {
            setLanguage(tempLanguage);
        }
        onClose();
    };

    const handleCancel = () => {
        setTempTheme(theme);
        setTempLanguage(language);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className={styles.overlay} onClick={handleCancel} />

            {/* Modal */}
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t('settings')}</h2>
                    <button
                        className={styles.closeBtn}
                        onClick={handleCancel}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Theme Setting */}
                    <div className={styles.setting}>
                        <label htmlFor="theme-select">{t('theme')}</label>
                        <select
                            id="theme-select"
                            value={tempTheme}
                            onChange={(e) => setTempTheme(e.target.value as 'light' | 'dark')}
                            className={styles.select}
                        >
                            <option value="light">{t('light')}</option>
                            <option value="dark">{t('dark')}</option>
                        </select>
                    </div>

                    {/* Language Setting */}
                    <div className={styles.setting}>
                        <label htmlFor="language-select">{t('language')}</label>
                        <select
                            id="language-select"
                            value={tempLanguage}
                            onChange={(e) => setTempLanguage(e.target.value as 'en' | 'ru' | 'he')}
                            className={styles.select}
                        >
                            <option value="en">{t('english')}</option>
                            <option value="ru">{t('russian')}</option>
                            <option value="he">{t('hebrew')}</option>
                        </select>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        className={`${styles.btn} ${styles.secondary}`}
                        onClick={handleCancel}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        className={`${styles.btn} ${styles.primary}`}
                        onClick={handleSave}
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </>
    );
}


