import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { firebaseErrorKey } from '../utils/firebaseError';
import GoogleSignInButton from '../components/GoogleSignInButton';
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
            setError(firebaseErrorKey(err));
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
            setError(firebaseErrorKey(err));
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
                    {error && <div className={styles.error}>{t(error)}</div>}
                    <div className={styles.actions}>
                        <button type="submit" disabled={loading}>
                            {loading ? '...' : t('login')}
                        </button>
                        <Link to="/register">{t('register')}</Link>
                    </div>

                    <div className={styles.divider}>
                        <span>{t('or')}</span>
                    </div>

                    <GoogleSignInButton
                        onClick={handleGoogle}
                        disabled={loading}
                        label={t('login_with_google')}
                    />
                </form>
            </div>
        </div>
    );
}
