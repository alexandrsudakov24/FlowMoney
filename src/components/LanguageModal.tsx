import styles from "../styles/components/SettingsModal.module.css";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

interface LanguageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
    const { setLanguage, t } = useLanguage();
    const { updateLanguage } = useAuth();

    if (!isOpen) return null;

    const handleSelect = (value: "en" | "ru" | "he") => {
        setLanguage(value);
        updateLanguage(value); // persist to Firestore so sync works across devices
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />

            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t("language")}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <button className={styles.select} onClick={() => handleSelect("en")}>
                        English
                    </button>
                    <button className={styles.select} onClick={() => handleSelect("ru")}>
                        Русский
                    </button>
                    <button className={styles.select} onClick={() => handleSelect("he")}>
                        עברית
                    </button>
                </div>
            </div>
        </>
    );
}
