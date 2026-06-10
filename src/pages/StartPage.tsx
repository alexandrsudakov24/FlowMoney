import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/pages/StartPage.module.css';

export default function StartPage() {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <section className={styles.hero}>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <h1>{t('welcome_title')}</h1>
                    <p className={styles.lead}>{t('welcome_lead')}</p>

                    <div className={styles.actions}>
                        {user ? (
                            <p>{t('hi')}, {user.name} &mdash; <Link to="/">{t('go_to_dashboard')}</Link>.</p>
                        ) : (
                            <>
                                <Link to="/register">{t('create_account')}</Link>
                                <Link to="/login">{t('login')}</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
