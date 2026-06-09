import styles from '../styles/pages/ProfilePage.module.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProfilePage() {
    const { logout } = useAuth();
    const { t } = useLanguage();

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>{t('profile')}</h2>

            <div className={styles.card}>
                <h3 className={styles.cardTitle}>About FlowMoney</h3>
                <p className={styles.cardDescription}>
                    FlowMoney is a modern, lightweight expense tracker designed to help you manage your finances efficiently.
                </p>

                <h3 className={styles.cardTitle} style={{ marginTop: '20px' }}>Key Features</h3>
                <ul className={styles.cardList}>
                    <li>Completely offline - your data stays on your device</li>
                    <li>Local storage - no cloud required</li>
                    <li>Visual analytics with charts and graphs</li>
                    <li>Organize expenses by category</li>
                    <li>Modern, clean interface</li>
                </ul>

                <h3 className={styles.cardTitle} style={{ marginTop: '20px' }}>Privacy</h3>
                <p className={styles.cardDescription}>
                    All your expense data is stored locally in your browser. We never collect, store, or transmit any personal information to external servers.
                </p>

                {/* Logout button for all devices */}
                <button className={styles.logoutButton} onClick={logout}>
                    {t('logout')}
                </button>
            </div>
        </div>
    );
}
