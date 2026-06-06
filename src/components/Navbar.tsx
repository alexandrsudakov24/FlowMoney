import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/components/Navbar.module.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { theme, toggle } = useTheme();
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
                            <Link to="/">Dashboard</Link>
                            <Link to="/add">Add Transaction</Link>
                            <Link to="/profile">Profile</Link>
                            <span className={styles.avatar} aria-hidden="true" />
                            <span style={{ marginLeft: 8 }}>Hi, {user?.name}</span>
                            <button className="btn" onClick={handleLogout} style={{ marginLeft: 8 }}>
                                Logout
                            </button>
                        </>
                    )}
                    {!isAuthenticated && (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                    <button aria-label="Toggle theme" onClick={toggle} className="btn" style={{ marginLeft: 8 }}>
                        {theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                </nav>
            </header>

            {/* Mobile Header (< 768px) - MINIMAL HEADER */}
            <header className={`${styles.navbar} ${styles.mobileHeader}`}>
                <Link to="/" className={styles.brand}>FlowMoney</Link>
                <button aria-label="Toggle theme" onClick={toggle} className={styles.themeBtn}>
                    {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
            </header>

            {/* Mobile Bottom Navigation (< 768px) - ONLY SHOW WHEN AUTHENTICATED */}
            {isAuthenticatedPage && (
                <nav className={`${styles.mobileNav} ${styles.bottomNav}`}>
                    <Link to="/" className={styles.navItem} aria-label="Dashboard">
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/add" className={styles.navItem} aria-label="Add Transaction">
                        <span>Add</span>
                    </Link>
                    <Link to="/profile" className={styles.navItem} aria-label="Profile">
                        <span>Profile</span>
                    </Link>
                    <button
                        className={styles.navItem}
                        onClick={handleLogout}
                        aria-label="Logout"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <span>Logout</span>
                    </button>
                </nav>
            )}
        </>
    );
}
