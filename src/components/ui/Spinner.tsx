import styles from './Spinner.module.css';

interface Props {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export default function Spinner({ size = 'md', text }: Props) {
    return (
        <div className={styles.wrapper}>
            <div className={`${styles.spinner} ${styles[size]}`} role="status" aria-label="Loading" />
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
}
