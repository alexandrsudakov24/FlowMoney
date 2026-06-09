import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import styles from '../styles/components/Navbar.module.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SettingsModal from './SettingsModal';
import Avatar from './Avatar';

export default function Navbar() {
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const isAuthenticatedPage =
        isAuthenticated && !['/start', '/login', '/register'].includes(location.pathname);

    return (
        <>
            {/* Desktop Header */}
            <header className={`${styles.navbar} ${styles.desktopNav}`}>
                <Link to="/" className={styles.brand}>
                    <span className={styles.logo} aria-hidden="true" />
                    FlowMoney
                </Link>

                <nav className={styles.navLinks}>
                    {isAuthenticatedPage && (
                        <>
                            <Link to="/">{t('dashboard')}</Link>
                            <Link to="/add">{t('add_transaction')}</Link>
                            <Link to="/profile">{t('profile')}</Link>
                            <Avatar name={user?.name || ''} photoURL={user?.photoURL} size="medium" />
                            <span style={{ marginLeft: 8 }}>
                                {t('hi')}, {user?.name}
                            </span>
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

            {/* Mobile Header */}
            <header className={`${styles.navbar} ${styles.mobileHeader}`}>
                <Link to="/" className={styles.brand}>
                    <span className={styles.logo} aria-hidden="true" />
                    FlowMoney
                </Link>

                <button
                    aria-label="Settings"
                    onClick={() => setIsSettingsOpen(true)}
                    className={styles.settingsBtn}
                    title={t('settings')}
                >
                    ⚙
                </button>
            </header>

            {/* Mobile Bottom Navigation */}
            {isAuthenticatedPage && (
                <nav className={`${styles.mobileNav} ${styles.bottomNav}`}>
                    <Link to="/" className={styles.navItem}>
                        <span>{t('dashboard')}</span>
                    </Link>
                    <Link to="/add" className={styles.navItem}>
                        <span>{t('add')}</span>
                    </Link>
                    <Link to="/profile" className={styles.navItem}>
                        <span>{t('profile')}</span>
                    </Link>
                </nav>
            )}

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
