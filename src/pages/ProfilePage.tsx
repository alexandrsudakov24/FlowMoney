import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useFamily } from '../context/FamilyContext';
import { getCatLabel } from '../utils/getCatLabel';
import { currencySymbols } from '../constants/currency';
import { ThemeModal, LanguageModal, CurrencyModal, CategoryModal, FamilyModal } from '../components/modals';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
    const { user, logout, isAdmin } = useAuth();
    const { expenses, currency } = useApp();
    const { t } = useLanguage();
    const { family, invitations } = useFamily();

    const [themeOpen, setThemeOpen] = useState(false);
    const [languageOpen, setLanguageOpen] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [familyOpen, setFamilyOpen] = useState(false);

    const { totalExpenses, totalIncome, topCategory } = useMemo(() => {
        const map: Record<string, number> = {};
        let expenses_ = 0;
        let income = 0;
        expenses.forEach(e => {
            const amount = Number(e.amount || 0);
            if (e.type === 'expense') {
                expenses_ += amount;
                map[e.category] = (map[e.category] || 0) + amount;
            } else {
                income += amount;
            }
        });
        const raw = Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0];
        return {
            totalExpenses: expenses_,
            totalIncome: income,
            topCategory: raw ? getCatLabel(raw, t) : '—',
        };
    }, [expenses, t]);

    const symbol = currencySymbols[currency] ?? currency;

    const handleAppUpdate = async () => {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) await reg.update();
        }
        window.location.reload();
    };

    const handleExport = () => {
        const json = JSON.stringify(expenses, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowmoney-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const hasAccount = !!user?.email;

    return (
        <div className={styles.container}>
            <div className={styles.profileSection}>
                <img
                    src={user?.photoURL || '/icon.png'}
                    alt="Avatar"
                    className={styles.avatar}
                />
                <h2 className={styles.name}>{user?.name}</h2>
                <p className={styles.email}>{user?.email}</p>
            </div>

            {!hasAccount && (
                <div className={`${styles.block} ${styles.anonBlock}`}>
                    <h3 className={styles.blockTitle}>{t('save_your_data')}</h3>
                    <p className={styles.anonHint}>{t('save_your_data_hint')}</p>
                    <div className={styles.anonActions}>
                        <Link to="/register" className={styles.anonBtn}>{t('create_account')}</Link>
                        <Link to="/login" className={styles.anonBtnSecondary}>{t('login')}</Link>
                    </div>
                </div>
            )}

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t('stats')}</h3>
                <div className={styles.statRow}>
                    <span>{t('transactions')}</span>
                    <strong>{expenses.length}</strong>
                </div>
                <div className={styles.statRow}>
                    <span>{t('total_expenses')}</span>
                    <strong>{symbol}{totalExpenses.toFixed(2)}</strong>
                </div>
                <div className={styles.statRow}>
                    <span>{t('total_income')}</span>
                    <strong>{symbol}{totalIncome.toFixed(2)}</strong>
                </div>
                <div className={styles.statRow}>
                    <span>{t('top_category')}</span>
                    <strong>{topCategory}</strong>
                </div>
            </div>

            {hasAccount && (
                <div className={styles.block}>
                    <h3 className={styles.blockTitle}>{t('family')}</h3>
                    <div className={styles.settingRow}>
                        <div>
                            <span>{family ? family.name : t('no_family')}</span>
                            {!family && invitations.length > 0 && (
                                <span className={styles.invitationBadge}>{invitations.length}</span>
                            )}
                        </div>
                        <button className={styles.changeBtn} onClick={() => setFamilyOpen(true)}>
                            {t('change')}
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t('settings')}</h3>
                <div className={styles.settingRow}>
                    <span>{t('theme')}</span>
                    <button className={styles.changeBtn} onClick={() => setThemeOpen(true)}>
                        {t('change')}
                    </button>
                </div>
                <div className={styles.settingRow}>
                    <span>{t('language')}</span>
                    <button className={styles.changeBtn} onClick={() => setLanguageOpen(true)}>
                        {t('change')}
                    </button>
                </div>
                <div className={styles.settingRow}>
                    <span>{t('currency')}</span>
                    <button className={styles.changeBtn} onClick={() => setCurrencyOpen(true)}>
                        {currency}
                    </button>
                </div>
                <div className={styles.settingRow}>
                    <span>{t('categories')}</span>
                    <button className={styles.changeBtn} onClick={() => setCategoriesOpen(true)}>
                        {t('change')}
                    </button>
                </div>
            </div>

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t('update_app')}</h3>
                <button className={styles.exportBtn} onClick={handleAppUpdate}>
                    {t('update_app')}
                </button>
            </div>

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t('data_export')}</h3>
                <button className={styles.exportBtn} onClick={handleExport}>
                    {t('export_json')}
                </button>
            </div>

            {isAdmin && (
                <a href="/admin" className={styles.adminBtn}>
                    {t('admin_panel')}
                </a>
            )}

            {hasAccount && (
                <button className={styles.logoutBtn} onClick={logout}>
                    {t('logout')}
                </button>
            )}

            <ThemeModal isOpen={themeOpen} onClose={() => setThemeOpen(false)} />
            <LanguageModal isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
            <CurrencyModal isOpen={currencyOpen} onClose={() => setCurrencyOpen(false)} />
            <CategoryModal isOpen={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
            <FamilyModal isOpen={familyOpen} onClose={() => setFamilyOpen(false)} />
        </div>
    );
}