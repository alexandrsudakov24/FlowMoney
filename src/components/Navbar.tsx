import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/components/Navbar.module.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Avatar from './Avatar';

const IconDashboard = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
);

const IconAdd = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
);

const IconProfile = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);

export default function Navbar() {
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();

    const isAuthenticatedPage =
        isAuthenticated && !['/start', '/login', '/register'].includes(location.pathname);

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    return (
        <>
            {/* Desktop Header */}
            <header className={`${styles.navbar} ${styles.desktopNav}`}>
                <Link to="/" className={styles.brand}>
                    <img src="/icon.png" className={styles.logo} alt="" />
                    FlowMoney
                </Link>

                <nav className={styles.navLinks}>
                    {isAuthenticatedPage && (
                        <>
                            <Link to="/">{t('dashboard')}</Link>
                            <Link to="/add">{t('add_transaction')}</Link>
                            <Link to="/profile">{t('profile')}</Link>
                            <Avatar name={user?.name || ''} photoURL={user?.photoURL} size="medium" />
                            <span className={styles.greeting}>
                                {t('hi')}, {user?.name}
                            </span>
                        </>
                    )}

                      </nav>
            </header>

            {/* Mobile Header */}
            <header className={`${styles.navbar} ${styles.mobileHeader}`}>
                <Link to="/" className={styles.brand}>
                    <img src="/icon.png" className={styles.logo} alt="" />
                    FlowMoney
                </Link>
            </header>

            {/* Mobile Bottom Nav */}
            {isAuthenticatedPage && (
                <nav className={styles.mobileNav}>
                    <Link
                        to="/"
                        className={`${styles.navItem} ${isActive('/') ? styles.navItemActive : ''}`}
                    >
                        <IconDashboard />
                        <span className={styles.navLabel}>{t('dashboard')}</span>
                    </Link>
                    <Link
                        to="/add"
                        className={`${styles.navItem} ${isActive('/add') ? styles.navItemActive : ''}`}
                    >
                        <IconAdd />
                        <span className={styles.navLabel}>{t('add')}</span>
                    </Link>
                    <Link
                        to="/profile"
                        className={`${styles.navItem} ${isActive('/profile') ? styles.navItemActive : ''}`}
                    >
                        <IconProfile />
                        <span className={styles.navLabel}>{t('profile')}</span>
                    </Link>
                </nav>
            )}
        </>
    );
}
