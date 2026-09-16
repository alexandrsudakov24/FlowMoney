import { useEffect, useState } from 'react';
import styles from './SettingsModal.module.css';
import swatchStyles from './AccentColorModal.module.css';
import { useApp } from '../../context/AppContext';
import { ACCENT_COLORS, type AccentColor } from '../../stores/accentColorStore';
import { useLanguage } from '../../context/LanguageContext';
import { useModalA11y } from '../../hooks/useModalA11y';

interface AccentColorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccentColorModal({ isOpen, onClose }: AccentColorModalProps) {
    const { accentColor, changeAccentColor } = useApp();
    const { t } = useLanguage();
    const [selected, setSelected] = useState<AccentColor>(accentColor);
    const modalRef = useModalA11y(isOpen, onClose);

    // Reset the pending selection to the applied color each time the modal opens
    useEffect(() => {
        if (isOpen) setSelected(accentColor);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        changeAccentColor(selected);
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label={t('accent_color')} tabIndex={-1} ref={modalRef}>
                <div className={styles.header}>
                    <h2>{t('accent_color')}</h2>
                </div>
                <div className={styles.content}>
                    <div className={swatchStyles.swatchGrid}>
                        {ACCENT_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`${swatchStyles.swatch} ${swatchStyles[color]} ${selected === color ? swatchStyles.swatchActive : ''}`}
                                onClick={() => setSelected(color)}
                                aria-label={t(color)}
                                aria-pressed={selected === color}
                            >
                                {selected === color && <span aria-hidden="true">✓</span>}
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
