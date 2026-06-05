/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextType = {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
};

const KEY = 'flowmoney_theme_v1';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const stored = localStorage.getItem(KEY);
            if (stored === 'light' || stored === 'dark') return stored;
        } catch {
            // ignore
        }
        // default to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(KEY, theme);
        } catch {
            // ignore
        }
    }, [theme]);

    const setTheme = (t: Theme) => setThemeState(t);
    const toggle = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};



