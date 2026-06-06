import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import styles from '../styles/components/Navbar.module.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SettingsModal from './SettingsModal';

export default function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/start');
    };

    const isAuthenticatedPage = isAuthenticated && !['/start', '/login', '/register'].includes(location.pathname);

    return (
        <>
            {/* Desktop Header (>= 768px) - FULL NAVBAR */}
            <header className={`${styles.navbar} ${styles.desktopNav}`}>
                <Link to="/" className={styles.brand}>FlowMoney</Link>
                <nav className={styles.navLinks}>
                    {isAuthenticatedPage && (
                        <>
                            <Link to="/">{t('dashboard')}</Link>
                            <Link to="/add">{t('add_transaction')}</Link>
                            <Link to="/profile">{t('profile')}</Link>
                            <span className={styles.avatar} aria-hidden="true" />
                            <span style={{ marginLeft: 8 }}>{t('hi')}, {user?.name}</span>
                            <button className="btn" onClick={handleLogout} style={{ marginLeft: 8 }}>
                                {t('logout')}
                            </button>
                        </>
                    )}
                    {!isAuthenticated && (
                        <>
                            <Link to="/login">{t('login')}</Link>
                            <Link to="/register">{t('register')}</Link>
                        </>
                    )}
                    <button
                        aria-label="Settings"
                        onClick={() => setIsSettingsOpen(true)}
                        className={styles.settingsBtn}
                        title={t('settings')}
                    >
                        ⚙
                    </button>
                </nav>
            </header>

            {/* Mobile Header (< 768px) - MINIMAL HEADER */}
            <header className={`${styles.navbar} ${styles.mobileHeader}`}>
                <Link to="/" className={styles.brand}>FlowMoney</Link>
                <button
                    aria-label="Settings"
                    onClick={() => setIsSettingsOpen(true)}
                    className={styles.settingsBtn}
                    title={t('settings')}
                >
                    ⚙
                </button>
            </header>

            {/* Mobile Bottom Navigation (< 768px) - ONLY SHOW WHEN AUTHENTICATED */}
            {isAuthenticatedPage && (
                <nav className={`${styles.mobileNav} ${styles.bottomNav}`}>
                    <Link to="/" className={styles.navItem} aria-label="Dashboard">
                        <span>{t('dashboard')}</span>
                    </Link>
                    <Link to="/add" className={styles.navItem} aria-label="Add Transaction">
                        <span>{t('add')}</span>
                    </Link>
                    <Link to="/profile" className={styles.navItem} aria-label="Profile">
                        <span>{t('profile')}</span>
                    </Link>
                    <button
                        className={styles.navItem}
                        onClick={handleLogout}
                        aria-label="Logout"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <span>{t('logout')}</span>
                    </button>
                </nav>
            )}

            {/* Settings Modal */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
