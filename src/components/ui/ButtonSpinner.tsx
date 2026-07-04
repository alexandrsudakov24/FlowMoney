import styles from './ButtonSpinner.module.css';

export default function ButtonSpinner() {
    return <span className={styles.spinner} role="status" aria-label="Loading" />;
}
