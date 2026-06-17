# FlowMoney

**FlowMoney** is a personal finance tracker PWA. Track your income and expenses, view analytics, manage categories, and share a budget with your family.

---

## Features

- Add income and expenses with category, date, and note
- Dashboard with balance summary and filters (by month, type, keyword search)
- Charts: spending by category and income vs. expenses over time
- Family budget: invitations and shared transactions
- Custom categories
- Three languages: English, Russian, Hebrew (with RTL support)
- Light and dark theme
- Currency selection
- JSON data export
- PWA: installable on mobile, works like a native app

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite |
| Styles | CSS Modules, CSS variables |
| Forms | react-hook-form |
| Charts | Recharts |
| Routing | React Router v7 |
| Backend | Firebase Firestore + Firebase Auth |
| Hosting | Firebase Hosting |
| PWA | vite-plugin-pwa |

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
├── context/        # React contexts (Auth, App, Language, Theme, Family)
├── locales/        # Translation files
├── pages/          # Pages (Dashboard, Add, Edit, Profile, Admin, ...)
├── styles/         # CSS Modules + global variables
├── types/          # TypeScript types
└── utils/          # Utilities (currency symbols, etc.)
```

## Auth

The app uses Firebase anonymous auth on first open — you can start adding transactions immediately. On sign-up or Google login, the anonymous account is upgraded without any data loss.

---

# FlowMoney (Русский)

**FlowMoney** — личный финансовый трекер в виде PWA. Позволяет вести учёт доходов и расходов, видеть аналитику, управлять категориями и делиться бюджетом с семьёй.

---

## Возможности

- Добавление доходов и расходов с категорией, датой и заметкой
- Дашборд с балансом, суммой доходов/расходов и фильтрами (по месяцу, типу, поиску)
- Графики: распределение по категориям и динамика доходов/расходов по датам
- Семейный бюджет: приглашения, общие транзакции
- Кастомные категории
- Три языка: русский, английский, иврит (с поддержкой RTL)
- Светлая и тёмная тема
- Выбор валюты
- Экспорт данных в JSON
- PWA: устанавливается на телефон, работает как нативное приложение

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Стили | CSS Modules, CSS-переменные |
| Формы | react-hook-form |
| Графики | Recharts |
| Роутинг | React Router v7 |
| Backend | Firebase Firestore + Firebase Auth |
| Хостинг | Firebase Hosting |
| PWA | vite-plugin-pwa |

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
├── context/        # React-контексты (Auth, App, Language, Theme, Family)
├── locales/        # Файлы переводов
├── pages/          # Страницы (Dashboard, Add, Edit, Profile, Admin, ...)
├── styles/         # CSS Modules + глобальные переменные
├── types/          # TypeScript-типы
└── utils/          # Утилиты (символы валют и др.)
```

## Авторизация

Приложение использует анонимную авторизацию Firebase при первом открытии — можно сразу вносить транзакции. При регистрации или входе через Google анонимный аккаунт обновляется без потери данных.
