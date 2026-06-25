import styles from './SettingsModal.module.css';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

interface CurrencyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CURRENCIES = ['USD', 'EUR', 'ILS'];

export default function CurrencyModal({ isOpen, onClose }: CurrencyModalProps) {
    const { currency, changeCurrency } = useApp();
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t('currency')}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div className={styles.content}>
                    <p>{t('current_currency')}: <strong>{currency}</strong></p>
                    <div className={styles.setting}>
                        <select
                            className={styles.select}
                            value={currency}
                            onChange={(e) => changeCurrency(e.target.value)}
                        >
                            {CURRENCIES.map(cur => (
                                <option key={cur} value={cur}>{cur}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.secondary}`} onClick={onClose}>
                        {t('close')}
                    </button>
                </div>
            </div>
        </>
    );
}
