import styles from "../styles/components/SettingsModal.module.css";
import { useApp } from "../context/AppContext";

interface CurrencyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CurrencyModal({ isOpen, onClose }: CurrencyModalProps) {
    const { currency, changeCurrency } = useApp();

    if (!isOpen) return null;

    const currencies = ["USD", "EUR", "ILS", "GBP", "JPY"];

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />

            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Currency</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.content}>
                    <p>Current currency: <strong>{currency}</strong></p>

                    <div className={styles.setting}>
                        <select
                            className={styles.select}
                            value={currency}
                            onChange={(e) => changeCurrency(e.target.value)}
                        >
                            {currencies.map(cur => (
                                <option key={cur} value={cur}>
                                    {cur}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.secondary}`} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}
