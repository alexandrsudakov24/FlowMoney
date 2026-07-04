# FlowMoney

**FlowMoney** is a personal finance tracker PWA. Track your income and expenses, view analytics, manage categories, and share a budget with your family.

---

## Features

- Add income and expenses with category, date, and note
- Dashboard with balance summary and filters (by month, type, keyword search)
- Charts: spending by category and income vs. expenses over time
- Family budget: owner-only invitations, member removal, shared transactions
- Custom categories
- Three languages: English, Russian, Hebrew (with RTL support)
- Light and dark theme
- Currency selection
- JSON data export
- Role-based access: guest, registered user, admin
- Admin panel: manage users, review user feedback
- In-app feedback: send a message to the developer from your profile
- PWA: installable on mobile, works like a native app

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite |
| Styles | CSS Modules, CSS variables |
| Forms | react-hook-form |
| Charts | Recharts |
| Routing | React Router v7 |
| State | Zustand |
| Backend | Firebase Firestore + Firebase Auth |
| Hosting | Firebase Hosting |
| PWA | vite-plugin-pwa |
| Testing | Vitest + Testing Library |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Start dev server
npm run dev

# Production build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Full deploy (wipe + rebuild + deploy)
npm run clean-deploy
```

## Environment Variables

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Project Structure

```
src/
├── components/     # UI components (Navbar, Charts, ExpenseForm, ...)
├── constants/      # App-wide constants
├── context/        # React contexts (Auth, App, Language, Theme, Family, Toast)
├── hooks/          # Custom hooks (useExpenses, useCategories, useCurrency, ...)
├── i18n/           # Translation files (en, ru, he)
├── pages/          # Pages (Dashboard, Add, Edit, Profile, Admin, ...)
├── services/       # Firestore service layer (expenses, categories, family, auth)
├── stores/         # Zustand stores (expense, category, currency, family, auth)
├── styles/         # CSS Modules + global variables
├── test/           # Test utilities and setup
├── types/          # TypeScript types
└── utils/          # Utilities (currency symbols, etc.)
```

## Auth

The app uses Firebase anonymous auth on first open — you can start adding transactions immediately. On sign-up or Google login, the anonymous account is upgraded without any data loss.

## Roles

- **Guest** — anonymous session, full app access, can send feedback
- **User** — registered account (email/password or Google), can own/join a family budget
- **Admin** — access to `/admin`: manage users and review feedback messages

Within a family budget, only the **owner** can invite or remove members; a removed member's access is revoked immediately via Firestore security rules.

---

# FlowMoney (Русский)

**FlowMoney** — личный финансовый трекер в виде PWA. Позволяет вести учёт доходов и расходов, видеть аналитику, управлять категориями и делиться бюджетом с семьёй.

---

## Возможности

- Добавление доходов и расходов с категорией, датой и заметкой
- Дашборд с балансом, суммой доходов/расходов и фильтрами (по месяцу, типу, поиску)
- Графики: распределение по категориям и динамика доходов/расходов по датам
- Семейный бюджет: приглашения только от владельца, удаление участников, общие транзакции
- Кастомные категории
- Три языка: русский, английский, иврит (с поддержкой RTL)
- Светлая и тёмная тема
- Выбор валюты
- Экспорт данных в JSON
- Ролевая модель: гость, зарегистрированный пользователь, админ
- Панель администратора: управление пользователями, просмотр отзывов
- Обратная связь: отправка сообщения разработчику прямо из профиля
- PWA: устанавливается на телефон, работает как нативное приложение

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Стили | CSS Modules, CSS-переменные |
| Формы | react-hook-form |
| Графики | Recharts |
| Роутинг | React Router v7 |
| Состояние | Zustand |
| Backend | Firebase Firestore + Firebase Auth |
| Хостинг | Firebase Hosting |
| PWA | vite-plugin-pwa |
| Тесты | Vitest + Testing Library |

## Быстрый старт

```bash
# Установить зависимости
npm install

# Создать .env с Firebase-конфигурацией (см. .env.example)
cp .env.example .env

# Запустить dev-сервер
npm run dev

# Собрать продакшн-сборку
npm run build

# Задеплоить на Firebase Hosting
firebase deploy --only hosting

# Полный деплой (очистка + пересборка + деплой)
npm run clean-deploy
```

## Переменные окружения

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Структура проекта

```
src/
├── components/     # UI-компоненты (Navbar, Charts, ExpenseForm, ...)
├── constants/      # Константы приложения
├── context/        # React-контексты (Auth, App, Language, Theme, Family, Toast)
├── hooks/          # Кастомные хуки (useExpenses, useCategories, useCurrency, ...)
├── i18n/           # Файлы переводов (en, ru, he)
├── pages/          # Страницы (Dashboard, Add, Edit, Profile, Admin, ...)
├── services/       # Сервисный слой Firestore (expenses, categories, family, auth)
├── stores/         # Zustand-сторы (expense, category, currency, family, auth)
├── styles/         # CSS Modules + глобальные переменные
├── test/           # Тестовые утилиты и настройки
├── types/          # TypeScript-типы
└── utils/          # Утилиты (символы валют и др.)
```

## Авторизация

Приложение использует анонимную авторизацию Firebase при первом открытии — можно сразу вносить транзакции. При регистрации или входе через Google анонимный аккаунт обновляется без потери данных.

## Роли

- **Гость** — анонимная сессия, полный доступ к приложению, может отправлять отзывы
- **Пользователь** — зарегистрированный аккаунт (email/пароль или Google), может владеть семейным бюджетом или состоять в нём
- **Админ** — доступ к `/admin`: управление пользователями и просмотр отзывов

В семейном бюджете приглашать и удалять участников может только **владелец**; доступ удалённого участника отзывается немедленно через правила безопасности Firestore.
