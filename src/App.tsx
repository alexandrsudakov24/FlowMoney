import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AddExpensePage from './pages/AddExpensePage';
import EditExpensePage from './pages/EditExpensePage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';

export default function App() {
    return (
        <div className="app">
            <Navbar />
            <main className="container">
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/add" element={<AddExpensePage />} />
                    <Route path="/edit/:id" element={<EditExpensePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Routes>
            </main>
        </div>
    );
}
