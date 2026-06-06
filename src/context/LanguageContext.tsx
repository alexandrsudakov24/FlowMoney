import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Language = 'en' | 'ru' | 'he';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
    en: {
        'dashboard': 'Dashboard',
        'add_transaction': 'Add Transaction',
        'profile': 'Profile',
        'logout': 'Logout',
        'login': 'Login',
        'register': 'Register',
        'settings': 'Settings',
        'theme': 'Theme',
        'language': 'Language',
        'english': 'English',
        'russian': 'Русский',
        'hebrew': 'עברית',
        'light': 'Light',
        'dark': 'Dark',
        'close': 'Close',
        'save': 'Save',
        'expense': 'Expense',
        'income': 'Income',
        'total_income': 'Total Income',
        'total_expenses': 'Total Expenses',
        'net_balance': 'Net Balance',
        'hi': 'Hi',
        'recent_transactions': 'Recent Transactions',
        'category': 'Category',
        'amount': 'Amount',
        'date': 'Date',
        'notes': 'Notes',
        'add': 'Add',
        'edit': 'Edit',
        'delete': 'Delete',
        'cancel': 'Cancel',
        'name': 'Name',
        'email': 'Email',
        'password': 'Password',
        'confirm_password': 'Confirm Password',
        'select_language': 'Select Language',
        'already_have_account': 'Already have an account? Login',
        'create_account': 'Create Account',
    },
    ru: {
        'dashboard': 'Панель управления',
        'add_transaction': 'Добавить операцию',
        'profile': 'Профиль',
        'logout': 'Выход',
        'login': 'Вход',
        'register': 'Регистрация',
        'settings': 'Настройки',
        'theme': 'Тема',
        'language': 'Язык',
        'english': 'English',
        'russian': 'Русский',
        'hebrew': 'עברית',
        'light': 'Светлая',
        'dark': 'Тёмная',
        'close': 'Закрыть',
        'save': 'Сохранить',
        'expense': 'Расход',
        'income': 'Доход',
        'total_income': 'Всего доходов',
        'total_expenses': 'Всего расходов',
        'net_balance': 'Чистый баланс',
        'hi': 'Привет',
        'recent_transactions': 'Последние операции',
        'category': 'Категория',
        'amount': 'Сумма',
        'date': 'Дата',
        'notes': 'Примечания',
        'add': 'Добавить',
        'edit': 'Редактировать',
        'delete': 'Удалить',
        'cancel': 'Отмена',
        'name': 'Имя',
        'email': 'Email',
        'password': 'Пароль',
        'confirm_password': 'Подтвердите пароль',
        'select_language': 'Выберите язык',
        'already_have_account': 'Уже есть аккаунт? Вход',
        'create_account': 'Создать аккаунт',
    },
    he: {
        'dashboard': 'לוח מחוונים',
        'add_transaction': 'הוסף עסקה',
        'profile': 'פרופיל',
        'logout': 'התנתקות',
        'login': 'כניסה',
        'register': 'הרשמה',
        'settings': 'הגדרות',
        'theme': 'ערכת נושא',
        'language': 'שפה',
        'english': 'English',
        'russian': 'Русский',
        'hebrew': 'עברית',
        'light': 'בהיר',
        'dark': 'אפל',
        'close': 'סגור',
        'save': 'שמור',
        'expense': 'הוצאה',
        'income': 'הכנסה',
        'total_income': 'סה"כ הכנסות',
        'total_expenses': 'סה"כ הוצאות',
        'net_balance': 'יתרה נקייה',
        'hi': 'שלום',
        'recent_transactions': 'עסקאות אחרונות',
        'category': 'קטגוריה',
        'amount': 'סכום',
        'date': 'תאריך',
        'notes': 'הערות',
        'add': 'הוסף',
        'edit': 'ערוך',
        'delete': 'מחק',
        'cancel': 'בטל',
        'name': 'שם',
        'email': 'דוא"ל',
        'password': 'סיסמה',
        'confirm_password': 'אשר סיסמה',
        'select_language': 'בחר שפה',
        'already_have_account': 'כבר יש לך חשבון? כניסה',
        'create_account': 'צור חשבון',
    }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language') as Language;
        return saved || 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
        // Set HTML lang attribute for accessibility and RTL support
        document.documentElement.lang = language;
        // Set dir attribute for Hebrew (RTL language)
        if (language === 'he') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string): string => {
        return (translations[language] as Record<string, string>)[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};



