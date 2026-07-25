import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Avatar from './ui/Avatar';

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

const NAV_ITEMS = [
    { path: '/', Icon: IconDashboard, labelKey: 'dashboard' as const },
    { path: '/add', Icon: IconAdd, labelKey: 'add' as const },
    { path: '/profile', Icon: IconProfile, labelKey: 'profile' as const },
];

export default function Navbar() {
    const { role, user } = useAuth();
    const { t, language } = useLanguage();
    const location = useLocation();

    const isAuthenticatedPage =
        role !== null && !['/start', '/login', '/register'].includes(location.pathname);

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const activeIndex = NAV_ITEMS.findIndex((item) => isActive(item.path));

    // Slides a single pill indicator behind the active tab's icon, measuring
    // real DOM positions so it works regardless of RTL, locale label widths,
    // or viewport size.
    const navRef = useRef<HTMLElement>(null);
    const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

    useLayoutEffect(() => {
        const recompute = () => {
            const nav = navRef.current;
            const icon = iconRefs.current[activeIndex];
            if (!nav || !icon) return;
            const navRect = nav.getBoundingClientRect();
            const iconRect = icon.getBoundingClientRect();
            setIndicator({
                left: iconRect.left - navRect.left,
                top: iconRect.top - navRect.top,
                width: iconRect.width,
                height: iconRect.height,
            });
        };
        recompute();
        window.addEventListener('resize', recompute);
        return () => window.removeEventListener('resize', recompute);
    }, [activeIndex, language]);

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
                <nav className={styles.mobileNav} ref={navRef}>
                    {indicator && (
                        <span
                            className={styles.navIndicator}
                            style={{
                                transform: `translate(${indicator.left}px, ${indicator.top}px)`,
                                width: indicator.width,
                                height: indicator.height,
                            }}
                        />
                    )}
                    {NAV_ITEMS.map(({ path, Icon, labelKey }, i) => (
                        <Link
                            key={path}
                            to={path}
                            className={`${styles.navItem} ${isActive(path) ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIconWrap} ref={(el) => { iconRefs.current[i] = el; }}>
                                <Icon />
                            </span>
                            <span className={styles.navLabel}>{t(labelKey)}</span>
                        </Link>
                    ))}
                </nav>
            )}
        </>
    );
}
