// StartPage - simple landing
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StartPage() {
    const { user } = useAuth();

    return (
        <div>
            <h1>Welcome to FlowMoney</h1>
            <p>Simple personal finance tracker.</p>
            <div style={{ marginTop: 12 }}>
                {user ? (
                    <>
                        <p>Hello, {user.name} — go to your <Link to="/">Dashboard</Link>.</p>
                    </>
                ) : (
                    <>
                        <Link to="/register" className="btn">Create account</Link>
                        <Link to="/login" style={{ marginLeft: 8 }}>Login</Link>
                    </>
                )}
            </div>
        </div>
    );
}


