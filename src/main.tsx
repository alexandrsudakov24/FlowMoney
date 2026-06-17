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
    import('./utils/migrateLocalToFirestore');
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
