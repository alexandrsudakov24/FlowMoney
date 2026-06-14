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
import type { JSX } from 'react';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <StartPage />;
    return children;
};

const RequireAdmin = ({ children }: { children: JSX.Element }) => {
    const { user } = useAuth();
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
                    <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
                    <Route path="/start" element={<StartPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Routes>
            </main>
        </div>
    );
}
