-- ========================================================
-- SQL СХЕМА ДЛЯ ПОДКЛЮЧЕНИЯ К SUPABASE
-- Скопируйте и выполните этот скрипт в Supabase -> SQL Editor
-- ========================================================

-- 1. Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Таблица заданий (постов)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL DEFAULT 'Автор',
    title VARCHAR(150) NOT NULL DEFAULT 'Задание',
    prompt TEXT NOT NULL,
    date_text VARCHAR(100) NOT NULL DEFAULT '',
    deadline_text VARCHAR(100) NOT NULL DEFAULT 'Выполнение до 30.09',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    comment_count INT NOT NULL DEFAULT 0,
    completed_photo_url TEXT,
    completed_at VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Таблица комментариев к заданиям
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Таблица диалогов (чатов)
CREATE TABLE IF NOT EXISTS public.conversations (
    id VARCHAR(100) PRIMARY KEY,
    friend_name VARCHAR(100) NOT NULL,
    last_message TEXT DEFAULT '',
    date_text VARCHAR(100) NOT NULL DEFAULT '',
    time_text VARCHAR(100) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Таблица сообщений
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(100) NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    photo_url TEXT,
    time_text VARCHAR(50) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- НАСТРОЙКА REALTIME (для мгновенных сообщений в чате)
-- ========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- ========================================================
-- ПРАВА ДОСТУПА (Row Level Security / RLS)
-- Разрешаем чтение и добавление для авторизованных пользователей
-- ========================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update tasks" ON public.tasks FOR UPDATE USING (true);

CREATE POLICY "Allow public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow insert messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read convs" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Allow insert convs" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update convs" ON public.conversations FOR UPDATE USING (true);

CREATE POLICY "Allow public read comments" ON public.task_comments FOR SELECT USING (true);
CREATE POLICY "Allow insert comments" ON public.task_comments FOR INSERT WITH CHECK (true);
