import { useEffect, useState } from 'react';
import modalStyles from './SettingsModal.module.css';
import styles from './RolloverModal.module.css';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import { currencySymbols } from '../../constants/currency';
import type { RolloverMode } from '../../types';
import type { TranslationKeys } from '../../i18n';

interface RolloverModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ROLLOVER_OPTIONS: { value: RolloverMode; label: TranslationKeys; hint: TranslationKeys }[] = [
    { value: 'reset', label: 'rollover_reset', hint: 'rollover_reset_hint' },
    { value: 'full', label: 'rollover_full', hint: 'rollover_full_hint' },
    { value: 'surplus_only', label: 'rollover_surplus_only', hint: 'rollover_surplus_only_hint' },
    { value: 'deficit_only', label: 'rollover_deficit_only', hint: 'rollover_deficit_only_hint' },
];

export default function RolloverModal({ isOpen, onClose }: RolloverModalProps) {
    const { rolloverMode, updateRolloverMode, monthlyRollover, currency } = useApp();
    const { t } = useLanguage();
    const [selected, setSelected] = useState<RolloverMode>(rolloverMode);
    const modalRef = useModalA11y(isOpen, onClose);
    const symbol = currencySymbols[currency] ?? currency;

    // Reset the pending selection to the applied mode each time the modal opens
    useEffect(() => {
        if (isOpen) setSelected(rolloverMode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        updateRolloverMode(selected);
        onClose();
    };

    return (
        <>
            <div className={modalStyles.overlay} onClick={onClose} />
            <div className={modalStyles.modal} role="dialog" aria-modal="true" aria-label={t('rollover_settings')} tabIndex={-1} ref={modalRef}>
                <div className={modalStyles.header}>
                    <h2>{t('rollover_settings')}</h2>
                </div>
                <div className={modalStyles.content}>
                    {monthlyRollover.carryIn !== 0 && (
                        <p className={styles.infoLine}>
                            {t('carried_over').replace(
                                '{amount}',
                                `${monthlyRollover.carryIn > 0 ? '+' : ''}${monthlyRollover.carryIn.toFixed(2)} ${symbol}`
                            )}
                        </p>
                    )}
                    <div className={modalStyles.setting}>
                        <div className={styles.optionList}>
                            {ROLLOVER_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`${modalStyles.btn} ${styles.optionBtn} ${selected === opt.value ? modalStyles.primary : modalStyles.secondary}`}
                                    onClick={() => setSelected(opt.value)}
                                >
                                    <div>{t(opt.label)}</div>
                                    <p className={modalStyles.optionHint}>{t(opt.hint)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={modalStyles.footer}>
                    <button className={`${modalStyles.btn} ${modalStyles.cancel}`} onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button className={`${modalStyles.btn} ${modalStyles.save}`} onClick={handleSave}>
                        {t('save')}
                    </button>
                </div>
            </div>
        </>
    );
}
