import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/components/CategoryModal.module.css';
import modalStyles from '../styles/components/SettingsModal.module.css';

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Home', 'Shopping', 'Health', 'Other'];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function CategoryModal({ isOpen, onClose }: Props) {
    const { categories, addCategory, removeCategory, expenses } = useApp();
    const { t } = useLanguage();
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAdd = async () => {
        const name = input.trim();
        if (!name) return;
        if (categories.includes(name)) {
            setError(t('category_exists'));
            return;
        }
        await addCategory(name);
        setInput('');
        setError('');
    };

    const handleRemove = async (cat: string) => {
        const ok = await removeCategory(cat);
        if (!ok) setError(t('category_in_use'));
        else setError('');
    };

    // Sort by usage frequency
    const usageMap: Record<string, number> = {};
    expenses.forEach(e => {
        if (e.type === 'expense') usageMap[e.category] = (usageMap[e.category] || 0) + 1;
    });
    const sorted = [...categories].sort((a, b) => (usageMap[b] || 0) - (usageMap[a] || 0));

    const getCatLabel = (cat: string) => {
        const key = `cat_${cat.toLowerCase()}`;
        const translated = t(key);
        return translated !== key ? translated : cat;
    };

    return (
        <>
            <div className={modalStyles.overlay} onClick={onClose} />
            <div className={modalStyles.modal}>
                <div className={modalStyles.header}>
                    <h2>{t('categories')}</h2>
                    <button className={modalStyles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={modalStyles.content}>
                    <div className={styles.addRow}>
                        <input
                            className={styles.input}
                            value={input}
                            onChange={e => { setInput(e.target.value); setError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder={t('add_category')}
                        />
                        <button className={styles.addBtn} onClick={handleAdd}>+</button>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}

                    <ul className={styles.list}>
                        {sorted.map(cat => {
                            const isDefault = DEFAULT_CATEGORIES.includes(cat);
                            const inUse = expenses.some(e => e.category === cat);
                            const count = usageMap[cat] || 0;
                            const cantDelete = isDefault || inUse;
                            return (
                                <li key={cat} className={styles.item}>
                                    <span className={styles.name}>
                                        {getCatLabel(cat)}
                                        {count > 0 && (
                                            <span className={styles.count}>{count}</span>
                                        )}
                                    </span>
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => handleRemove(cat)}
                                        disabled={cantDelete}
                                        title={
                                            isDefault ? t('category_default')
                                            : inUse ? t('category_in_use')
                                            : ''
                                        }
                                    >
                                        ✕
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className={modalStyles.footer}>
                    <button
                        className={`${modalStyles.btn} ${modalStyles.secondary}`}
                        onClick={onClose}
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </>
    );
}
