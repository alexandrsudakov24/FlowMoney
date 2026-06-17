import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { currencySymbols } from '../utils/currencySymbols';
import { firebaseErrorKey } from '../utils/firebaseError';
import styles from '../styles/pages/RegisterPage.module.css';

export default function RegisterPage() {
    const { register, loginWithGoogle } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { setTheme } = useTheme();
    const { changeCurrency } = useApp();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ru' | 'he'>(language || 'en');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>('auto');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            setLanguage(selectedLanguage);
            setTheme(selectedTheme);
            changeCurrency(selectedCurrency);
            await register({ name, email, password, language: selectedLanguage });
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
            setLanguage(selectedLanguage);
            setTheme(selectedTheme);
            changeCurrency(selectedCurrency);
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
                <h2 className={styles.title}>{t('register')}</h2>
                <form onSubmit={submit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>{t('name')}</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>{t('email')}</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>{t('password')}</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
                    </div>

                    <div className={styles.prefsRow}>
                        <div className={styles.formGroup}>
                            <label>{t('select_language')}</label>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'ru' | 'he')}
                                className={styles.select}
                            >
                                <option value="en">{t('english')}</option>
                                <option value="ru">{t('russian')}</option>
                                <option value="he">{t('hebrew')}</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('select_currency')}</label>
                            <select
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                className={styles.select}
                            >
                                {Object.entries(currencySymbols).map(([code, symbol]) => (
                                    <option key={code} value={code}>{symbol} {code}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('select_theme')}</label>
                            <select
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value as 'light' | 'dark' | 'auto')}
                                className={styles.select}
                            >
                                <option value="auto">{t('auto')}</option>
                                <option value="light">{t('light')}</option>
                                <option value="dark">{t('dark')}</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            {error === 'error_email_in_use' ? (
                                <>{t('error_email_in_use')} <Link to="/login">{t('login')}</Link></>
                            ) : t(error)}
                        </div>
                    )}
                    <div className={styles.actions}>
                        <button type="submit" disabled={loading}>
                            {loading ? '...' : t('create_account')}
                        </button>
                        <Link to="/login">{t('already_have_account')}</Link>
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
                        {t('register_with_google')}
                    </button>
                </form>
            </div>
        </div>
    );
}
