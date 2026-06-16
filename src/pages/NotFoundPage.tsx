import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/pages/NotFoundPage.module.css';

export default function NotFoundPage() {
    const { t } = useLanguage();

    return (
        <div className={styles.container}>
            <h1 className={styles.code}>404</h1>
            <p className={styles.message}>{t('not_found')}</p>
            <Link to="/" className={styles.link}>{t('go_to_dashboard')}</Link>
        </div>
    );
}
