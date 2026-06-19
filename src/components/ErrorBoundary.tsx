import { Component, type ReactNode } from 'react';
import styles from '../styles/components/ErrorBoundary.module.css';

interface Props {
    children: ReactNode;
    /** Optional: key to reset boundary when it changes (e.g. route change) */
    resetKey?: string;
}

interface State {
    hasError: boolean;
    message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: '' };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false, message: '' });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.container}>
                    <div className={styles.icon}>⚠️</div>
                    <h2 className={styles.title}>Something went wrong</h2>
                    <p className={styles.message}>An unexpected error occurred. Try reloading the page.</p>
                    {this.state.message && (
                        <pre className={styles.detail}>{this.state.message}</pre>
                    )}
                    <button
                        className={styles.btn}
                        onClick={() => window.location.reload()}
                    >
                        Reload page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
