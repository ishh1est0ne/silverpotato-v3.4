const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env.JWT_SECRET || 'maniyak-super-secret-key-diploma-2026';
const PORT = process.env.PORT || 4000;

// Разрешаем CORS для мобильных устройств, Capacitor и браузера
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '25mb' }));

// Раздача статического лендинг-сайта
app.use(express.static(path.join(__dirname, 'public')));

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

// Карта онлайн-пользователей: userId -> { socketId, userName, lastSeen }
const onlineUsers = new Map();

// Расширенный банк 35 разнообразных заданий (BeReal-стиль)
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
  'Сфотографируй любой круглый предмет в комнате',
  'Сфоткай лестницу или ступеньки',
  'Сфотографируй уличный фонарь или настольную лампу',
  'Сфоткай свой рюкзак или сумку',
  'Сфотографируй провод, зарядку или кабель',
  'Сфоткай номер ближайшей машины или табличку с номером дома',
  'Сфотографируй текстуру дерева или коры',
  'Сфотографируй монетку или купюру',
  'Сфоткай открытую форточку или балкон',
  'Сфотографируй любимую футболку или худи',
  'Сфотографируй спортивный инвентарь или кроссовки',
  'Сфоткай то, что лежит у тебя в левом кармане',
  'Сфотографируй упаковку любого продукта на кухне',
  'Сфоткай что-то металлическое с отражением',
  'Сфотографируй свои наушники на поверхности',
];

// 1. Инициализация структуры таблиц базы данных и миграции
async function initDb() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ PostgreSQL таблицы успешно инициализированы');
    await cleanLegacyAndSetupAdmin();
    await checkExpiredTasks();
    await ensureInitialChallenge();
  } catch (err) {
    console.warn('⚠️ Подключение к базе PostgreSQL:', err.message);
  }
}
initDb();

// 2. Очистка старых фейковых чатов и создание аккуратного аккаунта admin
async function cleanLegacyAndSetupAdmin() {
  try {
    // Удаляем непристойные демо-чаты и старые мусорные тестовые записи
    await pool.query(`
      DELETE FROM conversations 
      WHERE friend_name ILIKE '%чмошник%' 
         OR friend_name ILIKE '%пидорас%'
         OR last_message ILIKE '%дура%';
    `);

    // Проверяем наличие аккаунта admin
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin' OR name = 'admin'");
    let adminId = null;

    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin', salt);
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ('admin', 'admin', $1, 'admin') RETURNING id`,
        [hash]
      );
      adminId = res.rows[0].id;
      console.log('👑 Создан чистый аккаунт администратора: admin / admin');
    } else {
      adminId = adminCheck.rows[0].id;
      // Убедимся, что роль установлена в admin
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminId]);
    }

    // Проверяем, есть ли хотя бы одно аккуратное выполненное задание у администратора (полу-полный профиль)
    const adminTaskCheck = await pool.query('SELECT id FROM tasks WHERE user_id = $1', [adminId]);
    if (adminTaskCheck.rows.length === 0) {
      const now = new Date();
      const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      await pool.query(
        `INSERT INTO tasks (id, user_id, title, author_name, prompt, date_text, deadline_text, is_completed, comment_count, completed_photo_url, completed_at)
         VALUES ($1, $2, '⚡ Задание дня', 'admin', 'Сфотографируй закат или вечернее небо', $3, 'Выполнено', true, 1, $4, $5)`,
        [
          `task-admin-${Date.now()}`,
          adminId,
          dateText,
          'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80',
          'Вчера, 19:40',
        ]
      );
    }
  } catch (err) {
    console.debug('Legacy cleanup notice:', err.message);
  }
}

// 3. Проверка просроченных дедлайнов (штраф за опоздание)
async function checkExpiredTasks() {
  try {
    const expired = await pool.query(`
      UPDATE tasks 
      SET is_failed = true, penalty = '-50 очков (штраф за дедлайн)' 
      WHERE expires_at < NOW() AND is_completed = false AND is_failed = false 
      RETURNING id, title, author_name
    `);

    if (expired.rows.length > 0) {
      for (const row of expired.rows) {
        io.emit('task_expired', { taskId: row.id, penalty: '-50 очков' });
      }
    }
  } catch (err) {
    console.debug('Task expiration check notice:', err.message);
  }
}
setInterval(checkExpiredTasks, 30 * 1000); // каждые 30 секунд

// Генерация или проверка активного челленджа дня с 10-минутным таймером
async function ensureInitialChallenge() {
  try {
    const active = await pool.query(
      'SELECT * FROM daily_challenges WHERE is_active = true AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1'
    );
    if (active.rows.length === 0) {
      await generateNewChallenge(10); // 10 минут дедлайн
    }
  } catch (e) {
    console.debug('Challenge check notice:', e.message);
  }
}

// Создание нового задания с таймером на durationMinutes (по умолчанию: 10 минут)
async function generateNewChallenge(durationMinutes = 10) {
  const randomPrompt = PHOTO_CHALLENGES[Math.floor(Math.random() * PHOTO_CHALLENGES.length)];
  const id = `ch-${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // Снимаем активность с предыдущих
  await pool.query('UPDATE daily_challenges SET is_active = false WHERE is_active = true');

  const res = await pool.query(
    `INSERT INTO daily_challenges (id, title, prompt, category, starts_at, expires_at, is_active)
     VALUES ($1, 'Задание дня', $2, 'photo', $3, $4, true) RETURNING *`,
    [id, randomPrompt, now, expiresAt]
  );

  const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const deadlineText = `Дедлайн 10 минут (до ${expiresAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})`;

  await pool.query(
    `INSERT INTO tasks (id, challenge_id, title, author_name, prompt, date_text, deadline_text, expires_at, is_completed, is_failed, comment_count)
     VALUES ($1, $2, 'Задание дня', 'Система', $3, $4, $5, $6, false, false, 0)`,
    [`task-${id}`, id, randomPrompt, dateText, deadlineText, expiresAt]
  );

  const taskObj = {
    id: `task-${id}`,
    challengeId: id,
    title: '⚡ Задание дня',
    authorName: 'Система',
    prompt: randomPrompt,
    dateText,
    deadlineText,
    expiresAt: expiresAt.toISOString(),
    isCompleted: false,
    isFailed: false,
    commentCount: 0,
  };

  io.emit('new_challenge', taskObj);
  return res.rows[0];
}

// Автоматический дроп задания каждые 15 минут
const DROP_INTERVAL_MS = 15 * 60 * 1000;
setInterval(async () => {
  try {
    console.log('⏰ [15 мин] Автоматическая публикация фото-задания дня (дедлайн 10 мин)...');
    await generateNewChallenge(10);
  } catch (err) {
    console.warn('Ошибка таймера дропа:', err.message);
  }
}, DROP_INTERVAL_MS);

// Middleware аутентификации JWT
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

// ==========================================
// 1. АВТОРИЗАЦИЯ И ПОЛЬЗОВАТЕЛИ
// ==========================================

// Регистрация
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
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'user') RETURNING id, name, email, role",
      [name.trim(), cleanEmail, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      user: { id: String(user.id), name: user.name, email: user.email, role: user.role || 'user' },
      token,
    });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Вход (поддерживает email или логин admin)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Введите логин/почту и пароль' });
  }

  const cleanLogin = email.trim().toLowerCase();

  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1 OR name = $1', [cleanLogin]);
    if (check.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин/почта или пароль' });
    }

    const user = check.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Неверный логин/почта или пароль' });
    }

    // Обновляем время последней активности
    await pool.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        avatarUrl: user.avatar_url,
      },
      token,
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// Текущий профиль пользователя
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  try {
    const found = await pool.query(
      'SELECT id, name, email, avatar_url, role, daily_tasks_count, daily_tasks_date, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (found.rows.length === 0) return res.json({ user: null });
    const u = found.rows[0];

    const todayStr = new Date().toISOString().slice(0, 10);
    const takenToday = u.daily_tasks_date === todayStr ? u.daily_tasks_count : 0;

    res.json({
      user: {
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        avatarUrl: u.avatar_url,
        createdAt: u.created_at,
        dailyTasksTakenToday: takenToday,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Сброс пароля (запрос)
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

    console.log(`🔑 [СБРОС ПАРОЛЯ] Токен для ${cleanEmail}: ${token}`);
    res.json({ sent: true, demoToken: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Подтверждение сброса пароля
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

// Список пользователей в сети и поиск (БЕЗ почты для безопасности!)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const currentId = req.user ? req.user.id : -1;
    const result = await pool.query(
      'SELECT id, name, avatar_url, role, last_seen FROM users WHERE id != $1 ORDER BY name ASC',
      [currentId]
    );

    const usersList = result.rows.map((u) => {
      const isOnline = onlineUsers.has(String(u.id));
      let lastSeenText = 'недавно';
      if (isOnline) {
        lastSeenText = 'в сети';
      } else if (u.last_seen) {
        lastSeenText = new Date(u.last_seen).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }

      return {
        id: String(u.id),
        name: u.name,
        avatarUrl: u.avatar_url,
        role: u.role || 'user',
        isOnline,
        lastSeenText,
      };
    });

    res.json(usersList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ЗАДАНИЯ И ЧЕЛЛЕНДЖИ ДНЯ
// ==========================================

// Активный челлендж дня
app.get('/api/challenges/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM daily_challenges WHERE is_active = true AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1'
    );
    if (result.rows.length === 0) {
      const newCh = await generateNewChallenge(10);
      return res.json(newCh);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ручной триггер дропа
app.post('/api/challenges/trigger-drop', async (req, res) => {
  try {
    const challenge = await generateNewChallenge(10);
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Досрочное взятие задания пользователем (максимум 2 раза в день)
app.post('/api/tasks/take-self', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Необходимо войти в аккаунт' });
  }

  const userId = req.user.id;
  const todayStr = new Date().toISOString().slice(0, 10);

  try {
    const uRes = await pool.query('SELECT daily_tasks_count, daily_tasks_date, name FROM users WHERE id = $1', [userId]);
    if (uRes.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });

    const user = uRes.rows[0];
    let currentCount = user.daily_tasks_date === todayStr ? user.daily_tasks_count : 0;

    if (currentCount >= 2) {
      return res.status(400).json({
        error: 'Лимит на сегодня исчерпан. Доступно максимум 2 досрочных задания в сутки.',
      });
    }

    currentCount += 1;
    await pool.query(
      'UPDATE users SET daily_tasks_count = $1, daily_tasks_date = $2 WHERE id = $3',
      [currentCount, todayStr, userId]
    );

    const randomPrompt = PHOTO_CHALLENGES[Math.floor(Math.random() * PHOTO_CHALLENGES.length)];
    const taskId = `task-self-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 минут
    const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const deadlineText = `Дедлайн 10 минут (до ${expiresAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})`;

    await pool.query(
      `INSERT INTO tasks (id, user_id, title, author_name, prompt, date_text, deadline_text, expires_at, source_type, is_completed, is_failed, comment_count)
       VALUES ($1, $2, '⚡ Досрочное задание', $3, $4, $5, $6, $7, 'self', false, false, 0)`,
      [taskId, userId, user.name, randomPrompt, dateText, deadlineText, expiresAt]
    );

    const newTask = {
      id: taskId,
      userId: String(userId),
      title: '⚡ Досрочное задание',
      authorName: user.name,
      prompt: randomPrompt,
      dateText,
      deadlineText,
      expiresAt: expiresAt.toISOString(),
      sourceType: 'self',
      isCompleted: false,
      isFailed: false,
      commentCount: 0,
      remainingTakesToday: 2 - currentCount,
    };

    io.emit('new_task', newTask);
    res.json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Админское досрочное завершение дедлайна (ускорение)
app.post('/api/admin/tasks/:id/expire-now', authenticateToken, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Только администратор может завершить дедлайн' });
  }

  const { id } = req.params;
  try {
    const updated = await pool.query(
      `UPDATE tasks 
       SET expires_at = NOW() - INTERVAL '1 second', 
           is_failed = true, 
           penalty = '-50 очков (штраф за дедлайн)' 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    io.emit('task_expired', { taskId: id, penalty: '-50 очков' });
    res.json({ ok: true, task: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Банк заданий
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
    const tasks = result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      authorName: r.author_name,
      userId: r.user_id ? String(r.user_id) : undefined,
      prompt: r.prompt,
      dateText: r.date_text,
      deadlineText: r.deadline_text,
      expiresAt: r.expires_at ? r.expires_at.toISOString() : undefined,
      isCompleted: r.is_completed,
      isFailed: r.is_failed,
      penalty: r.penalty,
      sourceType: r.source_type || 'system',
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

// Создать задание/пост вручную
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, prompt, deadlineText, authorName } = req.body;
  const id = `task-${Date.now()}`;
  const now = new Date();
  const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 минут
  const author = req.user ? req.user.name : authorName || 'Я';

  try {
    await pool.query(
      `INSERT INTO tasks (id, user_id, title, author_name, prompt, date_text, deadline_text, expires_at, is_completed, is_failed, comment_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false, 0)`,
      [
        id,
        req.user ? req.user.id : null,
        title || 'Задание',
        author,
        prompt,
        dateText,
        deadlineText || 'Дедлайн 10 минут',
        expiresAt,
      ]
    );

    const newTask = {
      id,
      userId: req.user ? String(req.user.id) : undefined,
      title: title || 'Задание',
      authorName: author,
      prompt,
      dateText,
      deadlineText: deadlineText || 'Дедлайн 10 минут',
      expiresAt: expiresAt.toISOString(),
      isCompleted: false,
      isFailed: false,
      commentCount: 0,
    };

    io.emit('new_task', newTask);
    res.json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Сдать фото-подтверждение задания (из камеры или галереи)
app.post('/api/tasks/:id/proof', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { photoDataUrl } = req.body;
  const now = new Date();
  const timeStr = `${now.toLocaleDateString('ru-RU')}, ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

  try {
    const result = await pool.query(
      `UPDATE tasks 
       SET is_completed = true, is_failed = false, completed_photo_url = $1, completed_at = $2 
       WHERE id = $3 RETURNING *`,
      [photoDataUrl, timeStr, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    const updatedTask = result.rows[0];
    io.emit('task_completed', {
      taskId: id,
      completedPhotoUrl: photoDataUrl,
      completedAt: timeStr,
    });

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Комментарии к заданию
app.get('/api/tasks/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { authorName, text } = req.body;
  const author = req.user ? req.user.name : authorName || 'Я';

  try {
    const insert = await pool.query(
      'INSERT INTO task_comments (task_id, user_id, author_name, text) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, req.user ? req.user.id : null, author, text]
    );
    await pool.query('UPDATE tasks SET comment_count = comment_count + 1 WHERE id = $1', [id]);
    io.emit('new_comment', insert.rows[0]);
    res.json(insert.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ДИАЛОГИ И ПЕРЕПИСКА 1-НА-1
// ==========================================

// Список диалогов для текущего пользователя
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user) {
      result = await pool.query(
        `SELECT c.*,
                u1.name as u1_name, u1.id as u1_id,
                u2.name as u2_name, u2.id as u2_id,
                (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.status != 'read' AND m.sender_id != $1) as unread_count
         FROM conversations c
         LEFT JOIN users u1 ON c.user1_id = u1.id
         LEFT JOIN users u2 ON c.user2_id = u2.id
         WHERE c.user1_id = $1 OR c.user2_id = $1
         ORDER BY c.updated_at DESC`,
        [req.user.id]
      );
    } else {
      result = await pool.query('SELECT * FROM conversations ORDER BY updated_at DESC');
    }

    const convs = result.rows.map((r) => {
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
        unread: parseInt(r.unread_count || 0, 10) > 0,
        unreadCount: parseInt(r.unread_count || 0, 10),
      };
    });

    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать или открыть существующий диалог между 2 пользователями
app.post('/api/conversations', authenticateToken, async (req, res) => {
  const { friendId, friendName } = req.body;
  const currentUserId = req.user ? req.user.id : null;
  const friendIdNum = friendId && !isNaN(Number(friendId)) ? Number(friendId) : null;

  try {
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

// Пометить сообщения в чате как прочитанные
app.post('/api/conversations/:chatId/read', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user ? req.user.id : null;

  try {
    if (currentUserId) {
      await pool.query(
        "UPDATE messages SET status = 'read', read_at = NOW() WHERE chat_id = $1 AND sender_id != $2 AND status != 'read'",
        [chatId, currentUserId]
      );
    } else {
      await pool.query("UPDATE messages SET status = 'read', read_at = NOW() WHERE chat_id = $1 AND status != 'read'", [
        chatId,
      ]);
    }

    io.to(`chat_${chatId}`).emit('messages_read', { chatId, readerId: currentUserId });
    res.json({ ok: true });
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
    res.json(
      result.rows.map((r) => ({
        id: r.id,
        chatId: r.chat_id,
        senderId: String(r.sender_id),
        senderName: r.sender_name,
        text: r.text,
        photoUrl: r.photo_url,
        timeText: r.time_text,
        status: r.status || 'delivered', // 'sending', 'delivered', 'read'
        isOutgoing: currentUserId ? r.sender_id === currentUserId : r.sender_name === 'Я',
      }))
    );
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
  const senderName = req.user ? req.user.name : req.body.senderName || 'Я';

  try {
    await pool.query(
      `INSERT INTO messages (id, chat_id, sender_id, sender_name, text, photo_url, time_text, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'delivered')`,
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
      status: 'delivered',
      isOutgoing: true,
    };

    io.to(`chat_${chatId}`).emit('new_message', message);
    io.emit('conversation_updated', { chatId, lastMessage: text, timeText });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. SOCKET.IO REALTIME & ONLINE TRACKING
// ==========================================
io.on('connection', (socket) => {
  console.log('🔌 Клиент подключен:', socket.id);

  // Регистрация онлайна пользователя
  socket.on('user_online', ({ userId, userName }) => {
    if (userId) {
      onlineUsers.set(String(userId), {
        socketId: socket.id,
        userName,
        lastSeen: new Date(),
      });
      socket.userId = String(userId);
      io.emit('online_users_updated', Array.from(onlineUsers.keys()));
    }
  });

  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Пользователь ${socket.id} вошел в комнату chat_${chatId}`);
  });

  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Клиент отключился:', socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online_users_updated', Array.from(onlineUsers.keys()));
    }
  });
});

// Обработчик ошибок в формате JSON для API
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.url} не найден на сервере` });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Необработанная ошибка сервера:', err);
  res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер фото-квестов успешно запущен на http://0.0.0.0:${PORT}`);
  console.log(`🌐 Лендинг веб-сайта доступен на http://0.0.0.0:${PORT}/`);
});
