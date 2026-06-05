import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/">Dashboard</Link>
            <Link to="/add">Add</Link>
            <Link to="/profile">Profile</Link>
        </nav>
    );
}
