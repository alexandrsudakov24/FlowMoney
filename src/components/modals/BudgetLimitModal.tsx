import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getCatLabel } from '../../utils/getCatLabel';
import { useModalA11y } from '../../hooks/useModalA11y';
import modalStyles from './SettingsModal.module.css';
import styles from './BudgetLimitModal.module.css';

interface Props {
    isOpen: boolean;
    category: string;
    currentLimit: number | undefined;
    symbol: string;
    onClose: () => void;
    onConfirm: (amount: number | null) => void;
}

// Two-step flow: type the amount, then explicitly confirm it before it's
// saved — nothing is written to Firestore until the user says "yes".
export default function BudgetLimitModal({ isOpen, category, currentLimit, symbol, onClose, onConfirm }: Props) {
    const { t } = useLanguage();
    const [step, setStep] = useState<'input' | 'confirm'>('input');
    const [value, setValue] = useState('');
    const modalRef = useModalA11y(isOpen, onClose);

    useEffect(() => {
        if (isOpen) {
            setValue(currentLimit ? String(currentLimit) : '');
            setStep('input');
        }
    }, [isOpen, currentLimit]);

    if (!isOpen) return null;

    const amount = Number(value);
    const isValid = value.trim() !== '' && Number.isFinite(amount) && amount > 0;

    const handleContinue = () => {
        if (!isValid) return;
        setStep('confirm');
    };

    const handleConfirmYes = () => {
        onConfirm(amount);
        onClose();
    };

    const handleRemove = () => {
        onConfirm(null);
        onClose();
    };

    return (
        <>
            <div className={modalStyles.overlay} onClick={onClose} />
            <div className={modalStyles.modal} role="dialog" aria-modal="true" aria-label={t('monthly_limit')} tabIndex={-1} ref={modalRef}>
                {step === 'input' ? (
                    <>
                        <div className={modalStyles.header}>
                            <h2>{getCatLabel(category, t)}</h2>
                            <button className={modalStyles.closeBtn} onClick={onClose} aria-label={t('close')}>✕</button>
                        </div>
                        <div className={modalStyles.content}>
                            <div className={modalStyles.setting}>
                                <label>{t('monthly_limit')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    inputMode="decimal"
                                    autoFocus
                                    className={modalStyles.select}
                                    placeholder={t('no_limit')}
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                                />
                            </div>
                            {currentLimit !== undefined && (
                                <button type="button" className={styles.removeLink} onClick={handleRemove}>
                                    {t('remove_limit')}
                                </button>
                            )}
                        </div>
                        <div className={modalStyles.footer}>
                            <button className={`${modalStyles.btn} ${modalStyles.secondary}`} onClick={onClose}>
                                {t('cancel')}
                            </button>
                            <button
                                className={`${modalStyles.btn} ${modalStyles.primary}`}
                                onClick={handleContinue}
                                disabled={!isValid}
                            >
                                {t('continue')}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={modalStyles.header}>
                            <h2>{t('confirm_limit_title')}</h2>
                        </div>
                        <div className={modalStyles.content}>
                            <p className={styles.confirmMessage}>
                                {getCatLabel(category, t)}: <strong>{amount.toFixed(2)} {symbol}</strong> / {t('this_month').toLowerCase()}
                            </p>
                        </div>
                        <div className={modalStyles.footer}>
                            <button className={`${modalStyles.btn} ${modalStyles.secondary}`} onClick={() => setStep('input')}>
                                {t('cancel')}
                            </button>
                            <button className={`${modalStyles.btn} ${modalStyles.save}`} onClick={handleConfirmYes}>
                                {t('confirm')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
