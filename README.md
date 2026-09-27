# Мобильное приложение (React / Next.js / Capacitor / Node.js)

Проект представляет собой реализацию мобильного интерфейса из Figma:
* **Авторизация**: Экран входа, регистрации и сброса пароля с органическими градиентами.
* **Экран 14 (Задания)**: Поиск по `#имя друга`, карточки заданий со статусами («Выполнено» / «Не выполнено»), дедлайнами, комментариями и модальным окном сдачи задания с фото-отчетом.
* **Экран 15 (Сообщения)**: Список диалогов с друзьями («Друг 1», «Друг 5», «Друг 12»), плашками времени и переходом в чат.
* **Экран 16 (Чат)**: Полнофункциональный экран чата с бабблами сообщений, таймштампами и панелью ввода.
* **Профиль & Уведомления**: Просмотр аккаунта, статус базы данных и уведомления.

---

## 🚀 Быстрый запуск

```bash
# 1. Установка зависимостей (уже выполнена)
npm install

# 2. Запуск локального сервера разработки
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.
В верхней панели доступен удобный переключатель между всеми экранами Figma и режим рамки iPhone 16 Pro.

---

## 🗄️ Архитектура данных: Service Layer (Repository Pattern)

Проект спроектирован так, чтобы переход с **Supabase в браузере** на **собственный Node.js сервер с PostgreSQL** происходил без изменений в React-компонентах:

```
React Components  --->  apiService (lib/service/apiService.ts)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   Supabase Client SDK               Локальный Mock DB /
   (при наличии .env.local)         Собственный Node.js Backend
```

### 1. Автономный локальный режим (по умолчанию)
Если ключи Supabase не заданы, приложение работает на встроенном реактивном локальном хранилище (`LocalStore`), позволяя сразу тестировать авторизацию, сдачу фото-заданий, комментирование и переписку в чате.

### 2. Подключение облачного Supabase
Создайте файл `.env.local` в корне проекта (см. образец в `.env.example`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
Приложение автоматически переключится на работу с Supabase Auth, PostgreSQL и Realtime сокетами для чата.

### 3. Переход на свой Node.js + PostgreSQL (Backend Migration)
В [lib/service/apiService.ts](file:///c:/Users/Dmitr/Music/maniyakDOLLARS-main/lib/service/apiService.ts) методы `api.tasks.*`, `api.auth.*`, `api.chat.*` заменяются на вызовы вашего REST/WebSocket API (`fetch('/api/tasks')`). Ни один React-компонент переписывать не потребуется!

---

## 📱 Сборка мобильного приложения (Capacitor)

Проект настроен со статическим экспортом Next.js (`output: 'export'`), что создает чистую HTML/JS/CSS сборку в папку `out/`, совместимую с Capacitor.

### Инициализация Capacitor:
```bash
# 1. Установка Capacitor CLI и Core
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 2. Инициализация проекта Capacitor
npx cap init "Maniyak App" "com.maniyak.app" --web-dir "out"

# 3. Добавление платформ
npx cap add android
npx cap add ios

# 4. Сборка статики и синхронизация
npm run build
npx cap sync

# 5. Запуск в Android Studio / Xcode
npx cap open android
```
