import { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { currencySymbols } from '../../constants/currency';
import { scanReceipt, GeminiRequestError, type ReceiptScanResult } from '../../services/gemini';
import { imageToBase64 } from '../../utils/imageToBase64';
import { getCatLabel } from '../../utils/getCatLabel';
import { ButtonSpinner } from '../ui';
import styles from './ReceiptScanner.module.css';

export type ScannedReceipt = Omit<ReceiptScanResult, 'isReceipt'>;

interface Props {
    /** Saves the scanned transaction as-is. */
    onConfirm: (receipt: ScannedReceipt) => Promise<void>;
    /** Hands the scanned values to the form for manual correction. */
    onEdit: (receipt: ScannedReceipt) => void;
}

// Photographs a receipt, lets Gemini read total/date/merchant, then shows a
// confirmation card describing exactly what will be added before saving.
export default function ReceiptScanner({ onConfirm, onEdit }: Props) {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const { currency, categories } = useApp();
    const inputRef = useRef<HTMLInputElement>(null);
    const [scanning, setScanning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [receipt, setReceipt] = useState<ScannedReceipt | null>(null);

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        setScanning(true);
        setReceipt(null);
        try {
            const image = await imageToBase64(file);
            const todayISO = new Date().toISOString().slice(0, 10);
            const result = await scanReceipt(image, categories, todayISO, language);
            if (!result.isReceipt || result.amount <= 0) {
                showToast(t('receipt_not_recognized'));
                return;
            }
            setReceipt({
                amount: Math.round(result.amount * 100) / 100,
                date: result.date || todayISO,
                category: result.category || categories[0] || 'Other',
                note: result.note,
            });
        } catch (err) {
            const code = err instanceof GeminiRequestError ? err.code : 'network_error';
            showToast(t(`receipt_error_${code}` as Parameters<typeof t>[0]));
        } finally {
            setScanning(false);
            // Allow picking the same file again after a failed attempt
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleConfirm = async () => {
        if (!receipt) return;
        setSaving(true);
        try {
            await onConfirm(receipt);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.wrap}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className={styles.fileInput}
                onChange={(e) => handleFile(e.target.files?.[0])}
                tabIndex={-1}
                aria-hidden="true"
            />

            {!receipt && (
                <button
                    type="button"
                    className={styles.scanButton}
                    onClick={() => inputRef.current?.click()}
                    disabled={scanning}
                >
                    <span className={styles.scanIcon} aria-hidden="true">{scanning ? <ButtonSpinner /> : '📷'}</span>
                    <span className={styles.scanText}>
                        <span className={styles.scanLabel}>{scanning ? t('receipt_scanning') : t('receipt_scan')}</span>
                        <span className={styles.scanDesc}>{t('receipt_scan_hint')}</span>
                    </span>
                </button>
            )}

            {receipt && (
                <div className={styles.card} role="dialog" aria-label={t('receipt_will_add')}>
                    <p className={styles.cardTitle}>{t('receipt_will_add')}</p>
                    <p className={styles.amount}>
                        −{receipt.amount.toFixed(2)} {currencySymbols[currency]}
                    </p>
                    <dl className={styles.details}>
                        <dt>{t('category')}</dt>
                        <dd>{getCatLabel(receipt.category, t)}</dd>
                        <dt>{t('date')}</dt>
                        <dd>{receipt.date}</dd>
                        {receipt.note && (
                            <>
                                <dt>{t('notes')}</dt>
                                <dd>{receipt.note}</dd>
                            </>
                        )}
                    </dl>
                    <div className={styles.actions}>
                        <button type="button" className={styles.confirm} onClick={handleConfirm} disabled={saving}>
                            {saving ? <><ButtonSpinner /> {t('saving')}</> : t('receipt_add')}
                        </button>
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={() => { onEdit(receipt); setReceipt(null); }}
                            disabled={saving}
                        >
                            {t('receipt_edit')}
                        </button>
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={() => setReceipt(null)}
                            disabled={saving}
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
