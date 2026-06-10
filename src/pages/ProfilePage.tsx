import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import { currencySymbols } from "../utils/currencySymbols";
import ThemeModal from "../components/ThemeModal";
import LanguageModal from "../components/LanguageModal";
import CurrencyModal from "../components/CurrencyModal";
import styles from "../styles/pages/ProfilePage.module.css";

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { expenses, currency } = useApp();
    const { t } = useLanguage();

    const [themeOpen, setThemeOpen] = useState(false);
    const [languageOpen, setLanguageOpen] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);

    const totalExpenses = expenses
        .filter(e => e.type === "expense")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalIncome = expenses
        .filter(e => e.type === "income")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const symbol = currencySymbols[currency] ?? currency;

    const handleExport = () => {
        const json = JSON.stringify(expenses, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowmoney-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const topCategory = (() => {
        const map: Record<string, number> = {};
        expenses.forEach(e => {
            if (e.type === "expense") {
                map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
            }
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    })();

    return (
        <div className={styles.container}>
            <div className={styles.profileSection}>
                <img
                    src={user?.photoURL || "/icon.png"}
                    alt="Avatar"
                    className={styles.avatar}
                />
                <h2 className={styles.name}>{user?.name}</h2>
                <p className={styles.email}>{user?.email}</p>
            </div>

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
            </div>

            <div className={styles.block}>
                <h3 className={styles.blockTitle}>{t('data_export')}</h3>
                <button className={styles.exportBtn} onClick={handleExport}>
                    {t('export_json')}
                </button>
            </div>

            <button className={styles.logoutBtn} onClick={logout}>
                {t('logout')}
            </button>

            <ThemeModal isOpen={themeOpen} onClose={() => setThemeOpen(false)} />
            <LanguageModal isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
            <CurrencyModal isOpen={currencyOpen} onClose={() => setCurrencyOpen(false)} />
        </div>
    );
}
