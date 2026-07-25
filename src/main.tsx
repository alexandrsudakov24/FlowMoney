import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { FamilyProvider } from './context/FamilyContext';
import { ToastProvider } from './context/ToastContext';
import './styles/index.css';
if (import.meta.env.DEV) {
    import('./utils/migration');
}

if (import.meta.env.PROD) {
    import('virtual:pwa-register').then(({ registerSW }) => {
        const updateSW = registerSW({
            immediate: true,
            onNeedRefresh() {
                updateSW(true);
            },
            onRegisteredSW(_url, registration) {
                if (!registration) return;
                registration.update();
                setInterval(() => registration.update(), 60 * 60 * 1000);
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') registration.update();
                });
            },
        });
    });
}

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <LanguageProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <FamilyProvider>
                                <AppProvider>
                                    <App />
                                </AppProvider>
                            </FamilyProvider>
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </LanguageProvider>
        </BrowserRouter>
    </React.StrictMode>
);
