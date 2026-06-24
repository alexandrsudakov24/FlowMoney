import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKeys } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { currencySymbols } from '../utils/currencySymbols';
import { firebaseErrorKey } from '../utils/firebaseError';
import GoogleSignInButton from '../components/GoogleSignInButton';
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
        if (password.length < 6) {
            setError('error_weak_password');
            return;
        }
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
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
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
                            ) : t(error as TranslationKeys)}
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

                    <GoogleSignInButton
                        onClick={handleGoogle}
                        disabled={loading}
                        label={t('register_with_google')}
                    />
                </form>
            </div>
        </div>
    );
}
