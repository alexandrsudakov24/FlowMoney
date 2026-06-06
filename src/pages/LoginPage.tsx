import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/pages/LoginPage.module.css';

export default function LoginPage() {
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        console.log('LoginPage: submit called, email:', email);
        try {
            console.log('LoginPage: calling login...');
            await login({ email, password });
            console.log('LoginPage: login returned successfully');
            console.log('LoginPage: navigating to /');
            navigate('/');
            console.log('LoginPage: navigate called');
        } catch (err: unknown) {
            console.error('LoginPage: login error:', err);
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Login failed');
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h2 className={styles.title}>{t('login')}</h2>
                <form onSubmit={submit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>{t('email')}</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>{t('password')}</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.actions}>
                        <button type="submit">{t('login')}</button>
                        <Link to="/register">{t('register')}</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}


