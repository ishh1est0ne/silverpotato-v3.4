-- ========================================================
-- СХЕМА БАЗЫ ДАННЫХ POSTGRESQL ДЛЯ PROXMOX СЕРВЕРА
-- ========================================================

-- 1. Пользователи (пароли хешируются через bcrypt)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Токены сброса пароля (срок действия 1 час)
CREATE TABLE IF NOT EXISTS password_resets (
    token VARCHAR(100) PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Челленджи / Задания дня (BeReal стиль: случайный дроп и таймер)
CREATE TABLE IF NOT EXISTS daily_challenges (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(150) NOT NULL DEFAULT 'Задание дня',
    prompt TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'photo',
    starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Задания и посты пользователей
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    challenge_id VARCHAR(100) REFERENCES daily_challenges(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL DEFAULT 'Задание',
    author_name VARCHAR(100) NOT NULL DEFAULT 'Автор',
    prompt TEXT NOT NULL,
    date_text VARCHAR(100) NOT NULL DEFAULT '',
    deadline_text VARCHAR(100) NOT NULL DEFAULT 'Выполнение до 30.09',
    expires_at TIMESTAMP,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    comment_count INT NOT NULL DEFAULT 0,
    completed_photo_url TEXT,
    completed_at VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Комментарии к заданиям
CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Диалоги между двумя реальными пользователями
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(100) PRIMARY KEY,
    user1_id INT REFERENCES users(id) ON DELETE CASCADE,
    user2_id INT REFERENCES users(id) ON DELETE CASCADE,
    friend_id VARCHAR(100),
    friend_name VARCHAR(100) NOT NULL DEFAULT '',
    last_message TEXT DEFAULT '',
    last_sender_id INT,
    date_text VARCHAR(100) DEFAULT '',
    time_text VARCHAR(100) DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Сообщения в диалогах
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    chat_id VARCHAR(100) REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    photo_url TEXT,
    time_text VARCHAR(50) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрой выборки сообщений и задач
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
