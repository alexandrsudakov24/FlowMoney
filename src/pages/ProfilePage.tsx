import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loadExpenses } from "../services/storageService";
import ThemeModal from "../components/ThemeModal";
import LanguageModal from "../components/LanguageModal";
import styles from "../styles/pages/ProfilePage.module.css";

export default function ProfilePage() {
    const { user, logout } = useAuth();

    const [themeOpen, setThemeOpen] = useState(false);
    const [languageOpen, setLanguageOpen] = useState(false);

    const expenses = loadExpenses();

    const totalExpenses = expenses
        .filter(e => e.type === "expense")
        .reduce((sum, e) => sum + e.amount, 0);

    const totalIncome = expenses
        .filter(e => e.type === "income")
        .reduce((sum, e) => sum + e.amount, 0);

    const topCategory = (() => {
        const map: Record<string, number> = {};
        expenses.forEach(e => {
            if (e.type === "expense") {
                map[e.category] = (map[e.category] || 0) + e.amount;
            }
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    })();

    return (
        <div className={styles.container}>
            {/* Profile */}
            <div className={styles.profileSection}>
                <img
                    src={user?.photoURL || "/icon.png"}
                    alt="Avatar"
                    className={styles.avatar}
                />

                <h2 className={styles.name}>{user?.name}</h2>
                <p className={styles.email}>{user?.email}</p>

            </div>

            {/* Stats */}
            <div className={styles.block}>
                <h3 className={styles.blockTitle}>Stats</h3>

                <div className={styles.statRow}>
                    <span>Transactions</span>
                    <strong>{expenses.length}</strong>
                </div>

                <div className={styles.statRow}>
                    <span>Total Expenses</span>
                    <strong>${totalExpenses.toFixed(2)}</strong>
                </div>

                <div className={styles.statRow}>
                    <span>Total Income</span>
                    <strong>${totalIncome.toFixed(2)}</strong>
                </div>

                <div className={styles.statRow}>
                    <span>Top Category</span>
                    <strong>{topCategory}</strong>
                </div>
            </div>

            {/* Settings */}
            <div className={styles.block}>
                <h3 className={styles.blockTitle}>Settings</h3>

                <div className={styles.settingRow}>
                    <span>Theme</span>
                    <button className={styles.changeBtn} onClick={() => setThemeOpen(true)}>
                        Change
                    </button>
                </div>

                <div className={styles.settingRow}>
                    <span>Language</span>
                    <button className={styles.changeBtn} onClick={() => setLanguageOpen(true)}>
                        Change
                    </button>
                </div>
            </div>

            {/* Export */}
            <div className={styles.block}>
                <h3 className={styles.blockTitle}>Data Export</h3>
                <button className={styles.exportBtn}>Export to JSON</button>
            </div>

            {/* Logout */}
            <button className={styles.logoutBtn} onClick={logout}>
                Logout
            </button>

            {/* Modals */}
            <ThemeModal isOpen={themeOpen} onClose={() => setThemeOpen(false)} />
            <LanguageModal isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
        </div>
    );
}
