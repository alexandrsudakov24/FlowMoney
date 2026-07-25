import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ErrorBoundary, Spinner } from './components/ui';
import DashboardPage from './pages/DashboardPage';
import AddExpensePage from './pages/AddExpensePage';
import EditExpensePage from './pages/EditExpensePage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import StartPage from './pages/StartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import type { JSX } from 'react';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const { role, authReady } = useAuth();
    const location = useLocation();
    if (!authReady) return <Spinner size="lg" />;
    if (role === null) {
        return location.pathname === '/' ? <StartPage /> : <Navigate to="/" replace />;
    }
    return children;
};

const RequireAdmin = ({ children }: { children: JSX.Element }) => {
    const { role, authReady } = useAuth();
    if (!authReady) return <Spinner size="lg" />;
    if (role !== 'admin') return <Navigate to="/" replace />;
    return children;
};

export default function App() {
    const { user } = useAuth();
    const { setLanguage } = useLanguage();
    const location = useLocation();

    useEffect(() => {
        if (user?.language) {
            setLanguage(user.language);
        }
    }, [user?.language, setLanguage]);

    // React Router doesn't reset scroll on navigation by default — without
    // this, navigating away from a scrolled-down page (e.g. the add-transaction
    // form) lands on the new page still scrolled down.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <div className="app">
            <Navbar />
            <main className="container">
                <ErrorBoundary resetKey={location.pathname}>
                <Routes>
                    <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                    <Route path="/add" element={<RequireAuth><AddExpensePage /></RequireAuth>} />
                    <Route path="/edit/:id" element={<RequireAuth><EditExpensePage /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </ErrorBoundary>
            </main>
        </div>
    );
}
