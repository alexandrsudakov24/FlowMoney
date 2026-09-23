import { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { scanReceipt, GeminiRequestError } from '../../services/gemini';
import { imageToBase64 } from '../../utils/imageToBase64';
import { ButtonSpinner } from '../ui';
import type { DraftTransaction } from './TransactionConfirmCard';
import buttonStyles from './QuickAddButton.module.css';

interface Props {
    onResult: (draft: DraftTransaction) => void;
    disabled?: boolean;
}

// Photographs a receipt and lets Gemini read total/date/merchant into a draft.
export default function ReceiptScanner({ onResult, disabled = false }: Props) {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const { categories } = useApp();
    const inputRef = useRef<HTMLInputElement>(null);
    const [scanning, setScanning] = useState(false);

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        setScanning(true);
        try {
            const image = await imageToBase64(file);
            const todayISO = new Date().toISOString().slice(0, 10);
            const result = await scanReceipt(image, categories, todayISO, language);
            if (!result.isReceipt || result.amount <= 0) {
                showToast(t('receipt_not_recognized'));
                return;
            }
            onResult({
                type: 'expense',
                amount: Math.round(result.amount * 100) / 100,
                date: result.date || todayISO,
                category: result.category || categories[0] || 'Other',
                note: result.note,
            });
        } catch (err) {
            const code = err instanceof GeminiRequestError ? err.code : 'network_error';
            showToast(t(`ai_input_error_${code}` as Parameters<typeof t>[0]));
        } finally {
            setScanning(false);
            // Allow picking the same file again after a failed attempt
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0])}
                tabIndex={-1}
                aria-hidden="true"
            />
            <button
                type="button"
                className={`${buttonStyles.button} ${buttonStyles.teal}`}
                onClick={() => inputRef.current?.click()}
                disabled={scanning || disabled}
            >
                <span className={buttonStyles.icon} aria-hidden="true">{scanning ? <ButtonSpinner /> : '📷'}</span>
                <span className={buttonStyles.text}>
                    <span className={buttonStyles.label}>{scanning ? t('receipt_scanning') : t('receipt_scan')}</span>
                    <span className={buttonStyles.desc}>{t('receipt_scan_hint')}</span>
                </span>
            </button>
        </>
    );
}
