import { useEffect, useState } from 'react';
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
    const [selected, setSelected] = useState(currency);

    // Reset the pending selection to the applied currency each time the modal opens
    useEffect(() => {
        if (isOpen) setSelected(currency);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        changeCurrency(selected);
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{t('currency')}</h2>
                </div>
                <div className={styles.content}>
                    <p>{t('current_currency')}: <strong>{currency}</strong></p>
                    <div className={styles.setting}>
                        <select
                            className={styles.select}
                            value={selected}
                            onChange={(e) => setSelected(e.target.value)}
                        >
                            {CURRENCIES.map(cur => (
                                <option key={cur} value={cur}>{cur}</option>
                            ))}
                        </select>
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
