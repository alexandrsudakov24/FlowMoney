import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AddExpensePage from './pages/AddExpensePage';
import EditExpensePage from './pages/EditExpensePage';
import ProfilePage from './pages/ProfilePage';
import StartPage from './pages/StartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import type {JSX} from "react";

export default function App() {
    const { isAuthenticated } = useAuth();

    const RequireAuth = ({ children }: { children: JSX.Element }) => {
        if (!isAuthenticated) return <StartPage />;
        return children;
    };
    return (
        <div className="app">
            <Navbar />
            <main className="container">
                <Routes>
                    <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                    <Route path="/add" element={<RequireAuth><AddExpensePage /></RequireAuth>} />
                    <Route path="/edit/:id" element={<RequireAuth><EditExpensePage /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                    <Route path="/start" element={<StartPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Routes>
            </main>
        </div>
    );
}
