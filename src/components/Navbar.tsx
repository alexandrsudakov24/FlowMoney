import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <header className={styles.navbar}>
            <Link to="/" className={styles.brand}>💰 FlowMoney</Link>
            <nav className={styles.navLinks}>
                <Link to="/">📊 Dashboard</Link>
                <Link to="/add">➕ Add Expense</Link>
                <Link to="/profile">👤 Profile</Link>
            </nav>
        </header>
    );
}
