import { useLanguage } from '../../context/LanguageContext';
import styles from './Spinner.module.css';

interface Props {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export default function Spinner({ size = 'md', text }: Props) {
    const { t } = useLanguage();
    return (
        <div className={styles.wrapper}>
            <div className={`${styles.spinner} ${styles[size]}`} role="status" aria-label={t('loading')} />
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
}
