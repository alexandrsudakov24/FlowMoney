import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await login({ email, password });
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Login failed');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={submit} style={{ maxWidth: 420 }}>
                <div>
                    <label>Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                </div>
                <div>
                    <label>Password</label>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
                </div>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                <div style={{ marginTop: 10 }}>
                    <button className="btn" type="submit">Login</button>
                    <Link to="/register" style={{ marginLeft: 8 }}>Register</Link>
                </div>
            </form>
        </div>
    );
}


