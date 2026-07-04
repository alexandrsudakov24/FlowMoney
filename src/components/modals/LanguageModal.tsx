import { useEffect, useState } from 'react';
import styles from './SettingsModal.module.css';
import { useLanguage } from '../../context/LanguageContext';
import type { Language } from '../../i18n';
import { useAuth } from '../../context/AuthContext';

interface LanguageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
    { value: 'he', label: 'עברית' },
];

export default function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
    const { language, setLanguage, t } = useLanguage();
    const { updateLanguage } = useAuth();
    const [selected, setSelected] = useState<Language>(language);

    // Reset the pending selection to the applied language each time the modal opens
    useEffect(() => {
        if (isOpen) setSelected(language);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        setLanguage(selected);
        updateLanguage(selected);
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t('language')}</h2>
                </div>
                <div className={styles.content}>
                    <div className={styles.setting}>
                        {LANGUAGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                className={`${styles.btn} ${selected === opt.value ? styles.primary : styles.secondary}`}
                                onClick={() => setSelected(opt.value)}
                                style={{ marginBottom: 8 }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.cancel}`} onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button className={`${styles.btn} ${styles.save}`} onClick={handleSave}>
                        {t('save')}
                    </button>
                </div>
            </div>
        </>
    );
}
