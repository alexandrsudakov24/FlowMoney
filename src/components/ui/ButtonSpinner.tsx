import { useLanguage } from '../../context/LanguageContext';
import styles from './ButtonSpinner.module.css';

export default function ButtonSpinner() {
    const { t } = useLanguage();
    return <span className={styles.spinner} role="status" aria-label={t('loading')} />;
}
