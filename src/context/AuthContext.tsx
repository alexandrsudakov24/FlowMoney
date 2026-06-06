/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type User = {
    id: string;
    name: string;
    email: string;
};

type RegisterData = { name: string; email: string; password: string };
type LoginData = { email: string; password: string };

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    register: (data: RegisterData) => Promise<User>;
    login: (data: LoginData) => Promise<User>;
    logout: () => void;
};

const USERS_KEY = 'flowmoney_users_v1';
const CURRENT_KEY = 'flowmoney_current_user_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readUsers = (): Array<{ id: string; name: string; email: string; password: string }> => {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
};

const writeUsers = (users: Array<{ id: string; name: string; email: string; password: string }>) => {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {
        // ignore
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const raw = localStorage.getItem(CURRENT_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        try {
            if (user) localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
            else localStorage.removeItem(CURRENT_KEY);
        } catch {
            // ignore
        }
    }, [user]);

    const register = async (data: RegisterData) => {
        const users = readUsers();
        if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
            return Promise.reject(new Error('User with this email already exists'));
        }
        const id = Date.now().toString();
        const newUser = { id, name: data.name, email: data.email, password: data.password };
        const next = [...users, newUser];
        writeUsers(next);
        const publicUser: User = { id, name: data.name, email: data.email };
        setUser(publicUser);
        return Promise.resolve(publicUser);
    };

    const login = async (data: LoginData) => {
        const users = readUsers();
        const found = users.find(
            (u) => u.email.toLowerCase() === data.email.toLowerCase() && u.password === data.password,
        );
        if (!found) return Promise.reject(new Error('Invalid credentials'));
        const publicUser: User = { id: found.id, name: found.name, email: found.email };
        setUser(publicUser);
        return Promise.resolve(publicUser);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export default AuthContext;


