import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AddExpensePage from './pages/AddExpensePage';
import EditExpensePage from './pages/EditExpensePage';
import ProfilePage from './pages/ProfilePage';
import AdminPage, { ADMIN_EMAIL } from './pages/AdminPage';
import StartPage from './pages/StartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Spinner from './components/Spinner';
import type { JSX } from 'react';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, authReady } = useAuth();
    if (!authReady) return <Spinner size="lg" />;
    if (!isAuthenticated) return <StartPage />;
    return children;
};

const RequireAdmin = ({ children }: { children: JSX.Element }) => {
    const { user, authReady } = useAuth();
    if (!authReady) return <Spinner size="lg" />;
    if (user?.email !== ADMIN_EMAIL) return <StartPage />;
    return children;
};

export default function App() {
    return (
        <div className="app">
            <Navbar />
            <main className="container">
                <Routes>
                    <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                    <Route path="/add" element={<RequireAuth><AddExpensePage /></RequireAuth>} />
                    <Route path="/edit/:id" element={<RequireAuth><EditExpensePage /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
                </Routes>
            </main>
        </div>
    );
}
