import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from './StartPage.module.css';

export default function StartPage() {
    const { loginAnonymously } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleGuest = async () => {
        setLoading(true);
        try {
            await loginAnonymously();
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className={styles.hero}>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <h1>{t('welcome_title')}</h1>
                    <p className={styles.lead}>{t('welcome_lead')}</p>

                    <div className={styles.actions}>
                        <Link to="/register">{t('create_account')}</Link>
                        <Link to="/login">{t('login')}</Link>
                        <button
                            className={styles.guestBtn}
                            onClick={handleGuest}
                            disabled={loading}
                        >
                            {loading ? '...' : t('continue_as_guest')}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
