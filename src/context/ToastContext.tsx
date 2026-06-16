/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import styles from '../styles/components/Toast.module.css';

type ToastType = 'error' | 'success' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, string> = {
    error: '✕',
    success: '✓',
    info: 'ℹ',
};

const AUTO_DISMISS_MS = 4000;
let nextId = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'error') => {
        const id = ++nextId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => remove(id), AUTO_DISMISS_MS);
    }, [remove]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.container}>
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`${styles.toast} ${styles[t.type]}`}
                        onClick={() => remove(t.id)}
                    >
                        <span className={styles.icon}>{ICONS[t.type]}</span>
                        <span className={styles.message}>{t.message}</span>
                        <button className={styles.close} onClick={() => remove(t.id)}>✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
