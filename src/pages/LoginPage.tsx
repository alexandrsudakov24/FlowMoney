import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/pages/LoginPage.module.css';

export default function LoginPage() {
    const { login, loginWithGoogle } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login({ email, password });
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h2 className={styles.title}>{t('login')}</h2>
                <form onSubmit={submit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>{t('email')}</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>{t('password')}</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            required
                        />
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.actions}>
                        <button type="submit" disabled={loading}>
                            {loading ? '...' : t('login')}
                        </button>
                        <Link to="/register">{t('register')}</Link>
                    </div>

                    <div className={styles.divider}>
                        <span>{t('or')}</span>
                    </div>

                    <button
                        type="button"
                        className={styles.googleBtn}
                        onClick={handleGoogle}
                        disabled={loading}
                    >
                        <svg width="18" height="18" viewBox="0 0 48 48" className={styles.googleIcon}>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        {t('login_with_google')}
                    </button>
                </form>
            </div>
        </div>
    );
}
