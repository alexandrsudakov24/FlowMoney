import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
    const { isAuthenticated, isGuest, authReady } = useAuth();
    if (!authReady) return <Spinner size="lg" />;
    if (!isAuthenticated && !isGuest) return <StartPage />;
    return children;
};

const RequireAdmin = ({ children }: { children: JSX.Element }) => {
    const { isAdmin, authReady } = useAuth();
    if (!authReady) return <Spinner size="lg" />;
    if (!isAdmin) return <StartPage />;
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
