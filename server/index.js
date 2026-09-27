const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Разрешаем CORS для подключения с мобильных устройств и локального фронтенда
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Настройка подключения к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/maniyak',
});

// Инициализация структуры таблиц
async function initDb() {
  try {
    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ PostgreSQL таблицы успешно проверены и инициализированы');
  } catch (err) {
    console.warn('⚠️ Ошибка подключения к базе PostgreSQL. Проверьте DATABASE_URL:', err.message);
  }
}
initDb();

// ==========================================
// API ЭНДПОИНТЫ
// ==========================================

// 1. Авторизация
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, password]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1 AND password_hash = $2', [email, password]);
    if (check.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const user = check.rows[0];
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Задания
app.get('/api/tasks', async (req, res) => {
  const { q } = req.query;
  try {
    let query = 'SELECT * FROM tasks ORDER BY created_at DESC';
    let params = [];
    if (q) {
      query = 'SELECT * FROM tasks WHERE author_name ILIKE $1 OR prompt ILIKE $1 ORDER BY created_at DESC';
      params = [`%${q}%`];
    }
    const result = await pool.query(query, params);
    const tasks = result.rows.map(r => ({
      id: r.id,
      title: r.title,
      authorName: r.author_name,
      prompt: r.prompt,
      dateText: r.date_text,
      deadlineText: r.deadline_text,
      isCompleted: r.is_completed,
      commentCount: r.comment_count,
      completedPhotoUrl: r.completed_photo_url,
      completedAt: r.completed_at,
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, prompt, deadlineText, authorName } = req.body;
  const id = `task-${Date.now()}`;
  const now = new Date();
  const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  try {
    await pool.query(
      `INSERT INTO tasks (id, title, author_name, prompt, date_text, deadline_text, is_completed, comment_count)
       VALUES ($1, $2, $3, $4, $5, $6, false, 0)`,
      [id, title || 'Задание', authorName || 'Я', prompt, dateText, deadlineText || 'Выполнение до 30.09']
    );

    const newTask = {
      id,
      title: title || 'Задание',
      authorName: authorName || 'Я',
      prompt,
      dateText,
      deadlineText: deadlineText || 'Выполнение до 30.09',
      isCompleted: false,
      commentCount: 0,
    };

    io.emit('new_task', newTask);
    res.json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/proof', async (req, res) => {
  const { id } = req.params;
  const { photoDataUrl } = req.body;
  const now = new Date();
  const timeStr = `${now.toLocaleDateString('ru-RU')}, ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

  try {
    const result = await pool.query(
      `UPDATE tasks SET is_completed = true, completed_photo_url = $1, completed_at = $2 WHERE id = $3 RETURNING *`,
      [photoDataUrl, timeStr, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Комментарии
app.get('/api/tasks/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { authorName, text } = req.body;
  try {
    const insert = await pool.query(
      'INSERT INTO task_comments (task_id, author_name, text) VALUES ($1, $2, $3) RETURNING *',
      [id, authorName || 'Я', text]
    );
    await pool.query('UPDATE tasks SET comment_count = comment_count + 1 WHERE id = $1', [id]);
    res.json(insert.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Диалоги и Сообщения
app.get('/api/conversations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conversations ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({
      id: r.id,
      friendId: r.friend_id,
      friendName: r.friend_name,
      lastMessage: r.last_message,
      dateText: r.date_text,
      timeText: r.time_text,
      unread: false,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations', async (req, res) => {
  const { friendName } = req.body;
  const id = `conv-${Date.now()}`;
  const friendId = `friend-${Date.now()}`;
  const now = new Date();
  const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  try {
    await pool.query(
      'INSERT INTO conversations (id, friend_id, friend_name, last_message, date_text, time_text) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, friendId, friendName, 'Чат создан', dateText, timeText]
    );
    const newConv = { id, friendId, friendName, lastMessage: 'Чат создан', dateText, timeText, unread: false };
    io.emit('new_conversation', newConv);
    res.json(newConv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/:chatId', async (req, res) => {
  const { chatId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC', [chatId]);
    res.json(result.rows.map(r => ({
      id: r.id,
      chatId: r.chat_id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      text: r.text,
      photoUrl: r.photo_url,
      timeText: r.time_text,
      isOutgoing: r.sender_id === 'current-user',
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  const { chatId, text, senderId, senderName, photoUrl } = req.body;
  const id = `msg-${Date.now()}`;
  const now = new Date();
  const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  try {
    await pool.query(
      'INSERT INTO messages (id, chat_id, sender_id, sender_name, text, photo_url, time_text) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, chatId, senderId || 'current-user', senderName || 'Я', text, photoUrl, timeText]
    );
    await pool.query('UPDATE conversations SET last_message = $1, time_text = $2 WHERE id = $3', [text, timeText, chatId]);

    const message = {
      id,
      chatId,
      senderId: senderId || 'current-user',
      senderName: senderName || 'Я',
      text,
      photoUrl,
      timeText,
      isOutgoing: true,
    };

    // Оповещаем участников через сокеты в реальном времени
    io.to(`chat_${chatId}`).emit('new_message', { ...message, isOutgoing: false });
    io.emit('conversation_updated', { chatId, lastMessage: text, timeText });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SOCKET.IO REALTIME ОБРАБОТЧИКИ
// ==========================================
io.on('connection', (socket) => {
  console.log('🔌 Клиент подключен:', socket.id);

  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Пользователь ${socket.id} вошел в комнату chat_${chatId}`);
  });

  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Клиент отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер успешно запущен на http://0.0.0.0:${PORT}`);
});
