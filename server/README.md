# Инструкция по развертыванию бэкенда и БД на Proxmox

В вашем распоряжении два равноправных способа подключения реальной базы данных:

---

## Вариант 1. Развертывание собственного сервера на PROXMOX (PostgreSQL + Node.js + WebSockets)

Так как у вас есть сервер Proxmox, вы можете поднять собственный полноценный бэкенд без сторонних сервисов.

### Шаг 1. Создайте LXC-контейнер или VM в Proxmox
1. В интерфейсе Proxmox VE нажмите **Create CT** (или создайте VM с Ubuntu/Debian).
2. Выделите контейнеру: 1-2 ядра CPU, 1-2 ГБ RAM, 10-20 ГБ диска.
3. В параметрах сети задайте статический IP или запомните выданный DHCP IP (например: `192.168.1.150`).

### Шаг 2. Установите Docker в контейнере
В консоли созданного контейнера выполните:
```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Шаг 3. Запустите бэкенд и базу данных
Скопируйте папку `server/` на ваш Proxmox (через SCP/Git) и запустите:
```bash
cd server
docker compose up -d --build
```
PostgreSQL и Node.js сервер запустятся автоматически. Порты:
- `5432` — база данных PostgreSQL
- `4000` — REST API и сокеты Socket.io

### Шаг 4. Подключите фронтенд к вашему Proxmox
В корне проекта создайте или отредактируйте файл `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.150:4000
```
(Замените `192.168.1.150` на IP вашего Proxmox).

---

## Вариант 2. Быстрое подключение облачного Supabase (2 минуты)

Если хотите запустить БД прямо сейчас без настройки Proxmox:

1. Зарегистрируйтесь на [supabase.com](https://supabase.com) и нажмите **New project**.
2. В боковом меню откройте **SQL Editor** -> **New query**.
3. Вставьте содержимое файла [`database/supabase_schema.sql`](../database/supabase_schema.sql) и нажмите **Run**.
4. Перейдите в **Project Settings -> API** и скопируйте:
   - `Project URL`
   - `anon / public key`
5. Вставьте их в `.env.local` в корне проекта:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
   ```
6. Перезапустите `npm run dev` — приложение готово к работе!
