// StartPage - simple landing
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/pages/StartPage.module.css';

export default function StartPage() {
    const { user } = useAuth();

    return (
        <section className={styles.hero}>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <h1>Welcome to FlowMoney</h1>
                    <p className={styles.lead}>Track your expenses, visualize spending and reach your goals.</p>

                    <div className={styles.actions}>
                        {user ? (
                            <p>Hello, {user.name} — go to your <Link to="/">Dashboard</Link>.</p>
                        ) : (
                            <>
                                <Link to="/register">Create account</Link>
                                <Link to="/login">Login</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}


