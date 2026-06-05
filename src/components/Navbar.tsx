import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
    const { theme, toggle } = useTheme();

    return (
        <header className={styles.navbar}>
            <Link to="/" className={styles.brand}>💰 FlowMoney</Link>
            <nav className={styles.navLinks}>
                <Link to="/">📊 Dashboard</Link>
                <Link to="/add">➕ Add Expense</Link>
                <Link to="/profile">👤 Profile</Link>
                <button aria-label="Toggle theme" onClick={toggle} className="btn" style={{ marginLeft: 8 }}>
                    {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
                </button>
            </nav>
        </header>
    );
}
