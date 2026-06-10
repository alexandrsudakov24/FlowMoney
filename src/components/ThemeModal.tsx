import styles from "../styles/components/SettingsModal.module.css";
import { useTheme } from "../context/ThemeContext";

interface ThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
    const { theme, toggle } = useTheme();

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
                    <h2>Theme</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <p>Current theme: <strong>{theme}</strong></p>
                </div>

                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.primary}`} onClick={handleToggle}>
                        Toggle Theme
                    </button>
                </div>
            </div>
        </>
    );
}
