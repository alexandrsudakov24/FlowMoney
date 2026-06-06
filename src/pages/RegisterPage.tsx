import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/pages/RegisterPage.module.css';

export default function RegisterPage() {
    const { register } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ru' | 'he'>(language || 'en');
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            // Set language before registration
            setLanguage(selectedLanguage);
            await register({
                name,
                email,
                password,
                language: selectedLanguage
            });
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Registration failed');
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
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.actions}>
                        <button type="submit">{t('create_account')}</button>
                        <Link to="/login">{t('already_have_account')}</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}


