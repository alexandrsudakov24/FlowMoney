import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/pages/RegisterPage.module.css';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await register({ name, email, password });
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Registration failed');
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h2 className={styles.title}>Register</h2>
                <form onSubmit={submit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.actions}>
                        <button type="submit">Create account</button>
                        <Link to="/login">Have account? Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}


