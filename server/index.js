const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env.JWT_SECRET || 'maniyak-super-secret-key-diploma-2026';
const PORT = process.env.PORT || 4000;

// Разрешаем CORS для мобильных устройств, Capacitor и браузера
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '25mb' }));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Настройка подключения к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:secretpassword@localhost:5432/maniyak',
});

// 20 случайных креативных заданий «на фото» (BeReal-стиль)
const PHOTO_CHALLENGES = [
  'Сфотографируй воду (стакан, река, лужа или капли)',
  'Сфотографируй небо прямо сейчас над собой',
  'Сфотографируй что-то ярко-красное вокруг тебя',
  'Сфоткай вид из своего окна на улицу',
  'Сфотографируй домашнего питомца или уличное животное',
  'Сфотографируй обувь, в которой ты сейчас обут',
  'Сфоткай свой горячий напиток (чай или кофе)',
  'Сфотографируй страницу любой книги или конспекта',
  'Сфоткай свой рабочий стол или экран устройства',
  'Сфотографируй необычную тень на стене или асфальте',
  'Сфоткай дорогу или улицу перед собой',
  'Сфотографируй своё отражение в зеркале или витрине',
  'Сфотографируй то, что ты ешь прямо сейчас',
  'Сфотографируй зелёное растение или цветок',
  'Сфоткай любые часы с текущим временем',
  'Сфотографируй ключи от дома или связку ключей',
  'Сфотографируй граффити или яркую вывеску',
  'Сфотографируй дверь или вход в здание',
  'Сфоткай самый старый предмет в твоей комнате',
  'Сфотографируй свою искреннюю улыбку',
];

// Инициализация структуры таблиц базы данных
async function initDb() {
  try {
    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ PostgreSQL таблицы успешно инициализированы');
    await ensureInitialChallenge();
    await ensureInitialTasks();
  } catch (err) {
    console.warn('⚠️ Подключение к базе PostgreSQL:', err.message);
  }
}
initDb();

async function ensureInitialTasks() {
  try {
    const tasksCount = await pool.query('SELECT COUNT(*) FROM tasks');
    if (parseInt(tasksCount.rows[0].count, 10) <= 1) {
      console.log('🌱 Инициализация демонстрационных заданий и постов в базе данных...');
      const initialSeedTasks = [
        {
          id: 'task-daily-1',
          title: '⚡ Задание дня',
          author_name: 'Система',
          date_text: 'Сегодня',
          prompt: 'Сфотографируй воду (стакан, река, лужа или капли)',
          is_completed: false,
          deadline_text: 'Осталось 3 часа',
          expires_at: new Date(Date.now() + 3 * 3600 * 1000),
          comment_count: 2,
        },
        {
          id: 'task-feed-1',
          title: 'Задание',
          author_name: 'Мария',
          date_text: 'Сегодня',
          prompt: 'Сфотографируй воду (стакан, река, лужа или капли)',
          is_completed: true,
          deadline_text: 'Выполнено',
          comment_count: 2,
          completed_photo_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80',
          completed_at: 'Сегодня, 11:15',
        },
        {
          id: 'task-2',
          title: 'Задание',
          author_name: 'Алексей',
          date_text: '20 сентября 2026',
          prompt: 'Сфоткай дорогу или улицу перед собой',
          is_completed: true,
          deadline_text: 'Выполнено',
          comment_count: 2,
          completed_photo_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
          completed_at: '20.09.2026, 14:30',
        },
        {
          id: 'task-feed-2',
          title: 'Задание',
          author_name: 'Дмитрий',
          date_text: '20 сентября 2026',
          prompt: 'Сфотографируй небо прямо сейчас над собой',
          is_completed: true,
          deadline_text: 'Выполнено',
          comment_count: 1,
          completed_photo_url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80',
          completed_at: '20.09.2026, 18:45',
        },
        {
          id: 'task-1',
          title: 'Задание',
          author_name: 'Дмитрий',
          date_text: '20 сентября 2026',
          prompt: 'Сфотографируй небо прямо сейчас над собой',
          is_completed: false,
          deadline_text: 'Выполнение до 21.09',
          comment_count: 4,
        },
        {
          id: 'task-3',
          title: 'Задание',
          author_name: 'Мария',
          date_text: '20 сентября 2026',
          prompt: 'Сфотографируй что-то ярко-красное вокруг тебя',
          is_completed: false,
          deadline_text: 'Выполнение до 24.09',
          comment_count: 0,
        },
      ];

      for (const t of initialSeedTasks) {
        await pool.query(
          `INSERT INTO tasks (id, title, author_name, prompt, date_text, deadline_text, expires_at, is_completed, comment_count, completed_photo_url, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            t.id,
            t.title,
            t.author_name,
            t.prompt,
            t.date_text,
            t.deadline_text,
            t.expires_at || null,
            t.is_completed,
            t.comment_count,
            t.completed_photo_url || null,
            t.completed_at || null,
          ]
        );
      }
    }
  } catch (e) {
    console.debug('Initial tasks seed notice:', e.message);
  }
}

// Генерация или проверка активного челленджа дня с таймером
async function ensureInitialChallenge() {
  try {
    const active = await pool.query(
      'SELECT * FROM daily_challenges WHERE is_active = true AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1'
    );
    if (active.rows.length === 0) {
      await generateNewChallenge(3); // Челлендж на 3 часа
    }
  } catch (e) {
    console.debug('Challenge check notice:', e.message);
  }
}

async function generateNewChallenge(durationHours = 3) {
  const randomPrompt = PHOTO_CHALLENGES[Math.floor(Math.random() * PHOTO_CHALLENGES.length)];
  const id = `ch-${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  // Снимаем активность с предыдущих
  await pool.query('UPDATE daily_challenges SET is_active = false WHERE is_active = true');

  const res = await pool.query(
    `INSERT INTO daily_challenges (id, title, prompt, category, starts_at, expires_at, is_active)
     VALUES ($1, 'Задание дня', $2, 'photo', $3, $4, true) RETURNING *`,
    [id, randomPrompt, now, expiresAt]
  );

  // Также создаем пост в tasks для ленты
  const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const deadlineText = `До ${expiresAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

  await pool.query(
    `INSERT INTO tasks (id, challenge_id, title, author_name, prompt, date_text, deadline_text, expires_at, is_completed, comment_count)
     VALUES ($1, $2, 'Задание дня', 'Система', $3, $4, $5, $6, false, 0)`,
    [`task-${id}`, id, randomPrompt, dateText, deadlineText, expiresAt]
  );

  const challenge = res.rows[0];
  io.emit('new_challenge', challenge);
  return challenge;
}

// Middleware аутентификации по JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}

function requireAuth(req, res, next) {
  authenticateToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    next();
  });
}

// Настройка почтового сервиса (SMTP опционален)
const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

// ==========================================
// 1. АВТОРИЗАЦИЯ И ПОЛЬЗОВАТЕЛИ
// ==========================================

// Регистрация с хешированием пароля через bcrypt
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const check = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с такой почтой уже зарегистрирован' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), cleanEmail, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({ user: { id: String(user.id), name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Вход с проверкой bcrypt хеша
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Введите почту и пароль' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (check.rows.length === 0) {
      return res.status(401).json({ error: 'Неверная почта или пароль' });
    }

    const user = check.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Неверная почта или пароль' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      user: { id: String(user.id), name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// Текущий профиль
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  try {
    const found = await pool.query('SELECT id, name, email, avatar_url FROM users WHERE id = $1', [req.user.id]);
    if (found.rows.length === 0) return res.json({ user: null });
    const u = found.rows[0];
    res.json({ user: { id: String(u.id), name: u.name, email: u.email, avatarUrl: u.avatar_url } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Запрос сброса пароля (с отправкой email через SMTP или демо-токеном)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Укажите почту' });

  const cleanEmail = email.trim().toLowerCase();

  try {
    const found = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь с такой почтой не найден' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await pool.query('INSERT INTO password_resets (token, user_id, expires_at) VALUES ($1, $2, $3)', [
      token,
      found.rows[0].id,
      expiresAt,
    ]);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/?reset=${token}`;

    if (mailer) {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: cleanEmail,
        subject: 'Восстановление пароля — Фото-Квесты',
        text: `Для сброса пароля перейдите по ссылке: ${link}\nСсылка действительна 1 час.`,
      });
      return res.json({ sent: true });
    }

    console.log(`🔑 [ДЕМО СБРОС] Ссылка сброса для ${cleanEmail}: ${link}`);
    res.json({ sent: false, demoToken: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Подтверждение сброса пароля с сохранением bcrypt-хеша
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }

  try {
    const found = await pool.query(
      'SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (found.rows.length === 0) {
      return res.status(400).json({ error: 'Ссылка для сброса устарела или недействительна' });
    }

    const userId = found.rows[0].user_id;
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(password, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Список других пользователей (для начала переписки с другом)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const currentId = req.user ? req.user.id : -1;
    const result = await pool.query(
      'SELECT id, name, email, avatar_url FROM users WHERE id != $1 ORDER BY name ASC',
      [currentId]
    );
    res.json(result.rows.map(u => ({ id: String(u.id), name: u.name, email: u.email, avatarUrl: u.avatar_url })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ЗАДАНИЯ И ЧЕЛЛЕНДЖИ ДНЯ
// ==========================================

// Получить активный челлендж дня
app.get('/api/challenges/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM daily_challenges WHERE is_active = true AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1'
    );
    if (result.rows.length === 0) {
      const newCh = await generateNewChallenge(3);
      return res.json(newCh);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Принудительно сгенерировать случайное задание дня (для тестов/демо)
app.post('/api/challenges/trigger-drop', async (req, res) => {
  try {
    const duration = req.body.durationHours || 3;
    const challenge = await generateNewChallenge(duration);
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Список банка заданий
app.get('/api/challenges/bank', (req, res) => {
  res.json(PHOTO_CHALLENGES);
});

// Список заданий ленты
app.get('/api/tasks', async (req, res) => {
  const { q } = req.query;
  try {
    let query = 'SELECT * FROM tasks ORDER BY created_at DESC';
    let params = [];
    if (q) {
      query = 'SELECT * FROM tasks WHERE author_name ILIKE $1 OR prompt ILIKE $1 OR title ILIKE $1 ORDER BY created_at DESC';
      params = [`%${q}%`];
    }
    const result = await pool.query(query, params);
    const tasks = result.rows.map(r => ({
      id: r.id,
      title: r.title,
      authorName: r.author_name,
      userId: r.user_id ? String(r.user_id) : undefined,
      prompt: r.prompt,
      dateText: r.date_text,
      deadlineText: r.deadline_text,
      expiresAt: r.expires_at ? r.expires_at.toISOString() : undefined,
      isCompleted: r.is_completed,
      commentCount: r.comment_count,
      completedPhotoUrl: r.completed_photo_url,
      completedAt: r.completed_at,
      challengeId: r.challenge_id,
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать задание/пост
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, prompt, deadlineText, authorName, durationHours } = req.body;
  const id = `task-${Date.now()}`;
  const now = new Date();
  const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const expiresAt = durationHours ? new Date(now.getTime() + durationHours * 3600 * 1000) : null;
  const finalAuthor = req.user ? req.user.name : (authorName || 'Я');
  const userId = req.user ? req.user.id : null;

  try {
    await pool.query(
      `INSERT INTO tasks (id, user_id, title, author_name, prompt, date_text, deadline_text, expires_at, is_completed, comment_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 0)`,
      [id, userId, title || 'Задание', finalAuthor, prompt, dateText, deadlineText || 'Выполнение до конца дня', expiresAt]
    );

    const newTask = {
      id,
      userId: userId ? String(userId) : undefined,
      title: title || 'Задание',
      authorName: finalAuthor,
      prompt,
      dateText,
      deadlineText: deadlineText || 'Выполнение до конца дня',
      expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
      isCompleted: false,
      commentCount: 0,
    };

    io.emit('new_task', newTask);
    res.json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Сдача фото-отчета по заданию
app.post('/api/tasks/:id/proof', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { photoDataUrl } = req.body;
  const now = new Date();
  const timeStr = `${now.toLocaleDateString('ru-RU')}, ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

  try {
    const result = await pool.query(
      `UPDATE tasks SET is_completed = true, completed_photo_url = $1, completed_at = $2 WHERE id = $3 RETURNING *`,
      [photoDataUrl, timeStr, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }
    const updated = result.rows[0];
    const taskObj = {
      id: updated.id,
      title: updated.title,
      authorName: updated.author_name,
      userId: updated.user_id ? String(updated.user_id) : undefined,
      prompt: updated.prompt,
      dateText: updated.date_text,
      deadlineText: updated.deadline_text,
      expiresAt: updated.expires_at ? updated.expires_at.toISOString() : undefined,
      isCompleted: updated.is_completed,
      commentCount: updated.comment_count,
      completedPhotoUrl: updated.completed_photo_url,
      completedAt: updated.completed_at,
    };

    io.emit('task_updated', taskObj);
    res.json(taskObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Комментарии к заданию
app.get('/api/tasks/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC', [id]);
    res.json(result.rows.map(r => ({
      id: String(r.id),
      taskId: r.task_id,
      authorName: r.author_name,
      text: r.text,
      createdAt: new Date(r.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { authorName, text } = req.body;
  const finalAuthor = req.user ? req.user.name : (authorName || 'Я');
  const userId = req.user ? req.user.id : null;

  try {
    // Если задание отсутствует в таблице tasks (например демо или клиентское), создаем запись
    const taskCheck = await pool.query('SELECT id FROM tasks WHERE id = $1', [id]);
    if (taskCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO tasks (id, title, author_name, prompt, date_text, deadline_text, is_completed, comment_count)
         VALUES ($1, 'Задание', $2, 'Фото задание', 'Сегодня', 'Выполнено', false, 0)
         ON CONFLICT (id) DO NOTHING`,
        [id, finalAuthor]
      );
    }

    const insert = await pool.query(
      'INSERT INTO task_comments (task_id, user_id, author_name, text) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, userId, finalAuthor, text]
    );
    await pool.query('UPDATE tasks SET comment_count = comment_count + 1 WHERE id = $1', [id]);

    const comm = insert.rows[0];
    const commentObj = {
      id: String(comm.id),
      taskId: comm.task_id,
      authorName: comm.author_name,
      text: comm.text,
      createdAt: new Date(comm.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };

    io.emit('new_comment', commentObj);
    res.json(commentObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ДИАЛОГИ И ПЕРЕПИСКА МЕЖДУ ДВУМЯ УСТРОЙСТВАМИ
// ==========================================

// Список диалогов для текущего пользователя
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user) {
      result = await pool.query(
        `SELECT c.*,
                u1.name as u1_name, u1.id as u1_id,
                u2.name as u2_name, u2.id as u2_id
         FROM conversations c
         LEFT JOIN users u1 ON c.user1_id = u1.id
         LEFT JOIN users u2 ON c.user2_id = u2.id
         WHERE c.user1_id = $1 OR c.user2_id = $1 OR (c.user1_id IS NULL AND c.user2_id IS NULL)
         ORDER BY c.updated_at DESC`,
        [req.user.id]
      );
    } else {
      result = await pool.query('SELECT * FROM conversations ORDER BY updated_at DESC');
    }

    const convs = result.rows.map(r => {
      let friendName = r.friend_name;
      let friendId = r.friend_id || 'friend-unknown';

      if (req.user) {
        if (r.user1_id === req.user.id && r.u2_name) {
          friendName = r.u2_name;
          friendId = String(r.u2_id);
        } else if (r.user2_id === req.user.id && r.u1_name) {
          friendName = r.u1_name;
          friendId = String(r.u1_id);
        }
      }

      return {
        id: r.id,
        friendId,
        friendName: friendName || 'Друг',
        user1Id: r.user1_id ? String(r.user1_id) : undefined,
        user2Id: r.user2_id ? String(r.user2_id) : undefined,
        lastMessage: r.last_message,
        dateText: r.date_text,
        timeText: r.time_text,
        unread: false,
      };
    });

    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать или открыть существующий диалог с пользователем
app.post('/api/conversations', authenticateToken, async (req, res) => {
  const { friendId, friendName } = req.body;
  const currentUserId = req.user ? req.user.id : null;
  const friendIdNum = friendId && !isNaN(Number(friendId)) ? Number(friendId) : null;

  try {
    // Если оба пользователя известны, проверяем существующий диалог
    if (currentUserId && friendIdNum) {
      const existing = await pool.query(
        `SELECT * FROM conversations
         WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
         LIMIT 1`,
        [currentUserId, friendIdNum]
      );
      if (existing.rows.length > 0) {
        const r = existing.rows[0];
        return res.json({
          id: r.id,
          friendId: String(friendIdNum),
          friendName: friendName || r.friend_name,
          user1Id: String(r.user1_id),
          user2Id: String(r.user2_id),
          lastMessage: r.last_message,
          dateText: r.date_text,
          timeText: r.time_text,
          unread: false,
        });
      }
    }

    const id = `conv-${Date.now()}`;
    const now = new Date();
    const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    await pool.query(
      `INSERT INTO conversations (id, user1_id, user2_id, friend_id, friend_name, last_message, date_text, time_text)
       VALUES ($1, $2, $3, $4, $5, 'Чат создан', $6, $7)`,
      [id, currentUserId, friendIdNum, friendId || 'friend', friendName || 'Друг', dateText, timeText]
    );

    const newConv = {
      id,
      friendId: friendId || 'friend',
      friendName: friendName || 'Друг',
      user1Id: currentUserId ? String(currentUserId) : undefined,
      user2Id: friendIdNum ? String(friendIdNum) : undefined,
      lastMessage: 'Чат создан',
      dateText,
      timeText,
      unread: false,
    };

    io.emit('new_conversation', newConv);
    res.json(newConv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Сообщения диалога
app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user ? req.user.id : null;

  try {
    const result = await pool.query('SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC', [chatId]);
    res.json(result.rows.map(r => ({
      id: r.id,
      chatId: r.chat_id,
      senderId: String(r.sender_id),
      senderName: r.sender_name,
      text: r.text,
      photoUrl: r.photo_url,
      timeText: r.time_text,
      isOutgoing: currentUserId ? r.sender_id === currentUserId : r.sender_name === 'Я',
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отправить сообщение в чат
app.post('/api/messages', authenticateToken, async (req, res) => {
  const { chatId, text, photoUrl } = req.body;
  const id = `msg-${Date.now()}`;
  const now = new Date();
  const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const senderId = req.user ? req.user.id : 1;
  const senderName = req.user ? req.user.name : (req.body.senderName || 'Я');

  try {
    await pool.query(
      `INSERT INTO messages (id, chat_id, sender_id, sender_name, text, photo_url, time_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, chatId, senderId, senderName, text, photoUrl, timeText]
    );

    await pool.query(
      `UPDATE conversations SET last_message = $1, time_text = $2, last_sender_id = $3, updated_at = NOW() WHERE id = $4`,
      [text, timeText, senderId, chatId]
    );

    const message = {
      id,
      chatId,
      senderId: String(senderId),
      senderName,
      text,
      photoUrl,
      timeText,
      isOutgoing: true,
    };

    // Отправляем всем участникам комнаты в Socket.io в реальном времени!
    io.to(`chat_${chatId}`).emit('new_message', message);
    io.emit('conversation_updated', { chatId, lastMessage: text, timeText });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. SOCKET.IO REALTIME
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

// 404 handler в формате JSON (чтобы клиенты не получали HTML <!DOCTYPE>)
app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.url} не найден на сервере` });
});

// Глобальный обработчик ошибок в формате JSON
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error('Необработанная ошибка сервера:', err);
  res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер фото-квестов и чата успешно запущен на http://0.0.0.0:${PORT}`);
});
