-- ========================================================
-- СХЕМА БАЗЫ ДАННЫХ POSTGRESQL ДЛЯ PROXMOX СЕРВЕРА
-- ========================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(150) NOT NULL DEFAULT 'Задание',
    author_name VARCHAR(100) NOT NULL DEFAULT 'Автор',
    prompt TEXT NOT NULL,
    date_text VARCHAR(100) NOT NULL DEFAULT '',
    deadline_text VARCHAR(100) NOT NULL DEFAULT 'Выполнение до 30.09',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    comment_count INT NOT NULL DEFAULT 0,
    completed_photo_url TEXT,
    completed_at VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(100) REFERENCES tasks(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(100) PRIMARY KEY,
    friend_id VARCHAR(100) NOT NULL,
    friend_name VARCHAR(100) NOT NULL,
    last_message TEXT DEFAULT '',
    date_text VARCHAR(100) DEFAULT '',
    time_text VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    chat_id VARCHAR(100) REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(100) NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    photo_url TEXT,
    time_text VARCHAR(50) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
