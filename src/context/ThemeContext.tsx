/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'auto';
export type EffectiveTheme = 'light' | 'dark';

type ThemeContextType = {
    theme: Theme;
    effectiveTheme: EffectiveTheme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
};

const KEY = 'flowmoney_theme_v1';

const getSystemTheme = (): EffectiveTheme =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const stored = localStorage.getItem(KEY);
            if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
        } catch {
            // ignore
        }
        return 'auto';
    });

    const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
        theme === 'auto' ? getSystemTheme() : theme as EffectiveTheme
    );

    useEffect(() => {
        if (theme !== 'auto') {
            setEffectiveTheme(theme as EffectiveTheme);
            return;
        }
        // auto mode: set initial value and listen for changes
        setEffectiveTheme(getSystemTheme());
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setEffectiveTheme(e.matches ? 'dark' : 'light');
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', effectiveTheme);
    }, [effectiveTheme]);

    useEffect(() => {
        try {
            localStorage.setItem(KEY, theme);
        } catch {
            // ignore
        }
    }, [theme]);

    const setTheme = (t: Theme) => setThemeState(t);
    const toggle = () =>
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));

    return (
        <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};
