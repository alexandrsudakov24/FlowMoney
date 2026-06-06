import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { theme, toggle } = useTheme();
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/start');
    };

    return (
        <header className={styles.navbar}>
            <Link to="/" className={styles.brand}>FlowMoney</Link>
            <nav className={styles.navLinks}>
                <Link to="/">Dashboard</Link>
                <Link to="/add">Add Transaction</Link>
                <Link to="/profile">Profile</Link>
                {!isAuthenticated ? (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                ) : (
                    <>
                        <span style={{ marginLeft: 8 }}>Hi, {user?.name}</span>
                        <button className="btn" onClick={handleLogout} style={{ marginLeft: 8 }}>
                            Logout
                        </button>
                    </>
                )}
                <button aria-label="Toggle theme" onClick={toggle} className="btn" style={{ marginLeft: 8 }}>
                    {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
            </nav>
        </header>
    );
}
