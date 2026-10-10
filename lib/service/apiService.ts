import { io, Socket } from 'socket.io-client';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { User, TaskItem, TaskComment, ConversationItem, ChatMessage, AppNotification, UserSummary } from '../types';

export const customApiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://100.102.28.78:4000';
export const isCustomBackendConfigured = Boolean(
  customApiUrl && customApiUrl.startsWith('http')
);

export interface ResetRequestResult {
  sent: boolean;
  demoToken?: string;
}

// 20 случайных креативных заданий «на фото» (BeReal стиль)
export const PHOTO_CHALLENGES_BANK = [
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

// Начальные данные для локального режима
const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-daily-1',
    title: '⚡ Задание дня',
    authorName: 'Система',
    dateText: 'Сегодня',
    prompt: 'Сфотографируй воду (стакан, река, лужа или капли)',
    isCompleted: false,
    deadlineText: 'Осталось 3 часа',
    expiresAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    commentCount: 2,
  },
  {
    id: 'task-feed-1',
    title: 'Задание',
    authorName: 'Мария',
    dateText: 'Сегодня',
    prompt: 'Сфотографируй воду (стакан, река, лужа или капли)',
    isCompleted: true,
    deadlineText: 'Выполнено',
    commentCount: 2,
    completedPhotoUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80',
    completedAt: 'Сегодня, 11:15',
  },
  {
    id: 'task-2',
    title: 'Задание',
    authorName: 'Алексей',
    dateText: '20 сентября 2026',
    prompt: 'Сфоткай дорогу или улицу перед собой',
    isCompleted: true,
    deadlineText: 'Выполнено',
    commentCount: 2,
    completedPhotoUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    completedAt: '20.09.2026, 14:30',
  },
  {
    id: 'task-feed-2',
    title: 'Задание',
    authorName: 'Дмитрий',
    dateText: '20 сентября 2026',
    prompt: 'Сфотографируй небо прямо сейчас над собой',
    isCompleted: true,
    deadlineText: 'Выполнено',
    commentCount: 1,
    completedPhotoUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80',
    completedAt: '20.09.2026, 18:45',
  },
  {
    id: 'task-1',
    title: 'Задание',
    authorName: 'Дмитрий',
    dateText: '20 сентября 2026',
    prompt: 'Сфотографируй небо прямо сейчас над собой',
    isCompleted: false,
    deadlineText: 'Выполнение до 21.09',
    commentCount: 4,
  },
  {
    id: 'task-3',
    title: 'Задание',
    authorName: 'Мария',
    dateText: '20 сентября 2026',
    prompt: 'Сфотографируй что-то ярко-красное вокруг тебя',
    isCompleted: false,
    deadlineText: 'Выполнение до 24.09',
    commentCount: 0,
  },
];

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv-1',
    friendId: 'user-1',
    friendName: 'Друг 1',
    dateText: 'Сегодня',
    timeText: '13:20',
    lastMessage: 'Привет! Уже сдал фото-задание?',
    unread: false,
  },
  {
    id: 'conv-2',
    friendId: 'user-5',
    friendName: 'Друг 5',
    dateText: 'Вчера',
    timeText: '19:00',
    lastMessage: 'Ты спишь?',
    unread: true,
  },
  {
    id: 'conv-3',
    friendId: 'user-12',
    friendName: 'Друг 12',
    dateText: '12 сентября',
    timeText: '15:40',
    lastMessage: 'Что делаешь?',
    unread: false,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-1': [
    {
      id: 'm1',
      chatId: 'conv-1',
      senderId: 'user-1',
      senderName: 'Друг 1',
      text: 'Привет! Уже сдал фото-задание?',
      timeText: '12:00',
      isOutgoing: false,
    },
    {
      id: 'm2',
      chatId: 'conv-1',
      senderId: 'current-user',
      senderName: 'Я',
      text: 'Привет! Сейчас как раз фоткаю воду)',
      timeText: '12:02',
      isOutgoing: true,
    },
  ],
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Новое задание дня!',
    description: 'Появился случайный челлендж: "Сфотографируй воду"',
    timeText: '10 мин назад',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Новое сообщение',
    description: 'Друг 1 отправил вам сообщение в чате',
    timeText: '1 час назад',
    read: true,
  },
];

// Локальное хранилище данных (с поддержкой изоляции сессий вкладок через sessionStorage)
class LocalStore {
  static get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      // Для сессионных данных пользователя отдаем приоритет sessionStorage для независимости вкладок
      if (key === 'app_user' || key === 'app_token') {
        const sess = sessionStorage.getItem(key);
        if (sess) return JSON.parse(sess);
      }
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      if (key === 'app_user' || key === 'app_token') {
        if (value === null) {
          sessionStorage.removeItem(key);
          localStorage.removeItem(key);
        } else {
          sessionStorage.setItem(key, JSON.stringify(value));
          localStorage.setItem(key, JSON.stringify(value));
        }
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }
}

// Безопасный вызов fetch с гарантированной обработкой не-JSON ответов (например HTML 404 от Express)
async function safeFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data, error: data?.error };
    }
    const text = await res.text();
    return {
      ok: false,
      status: res.status,
      error: `Сервер вернул статус ${res.status}: ${text.slice(0, 80)}`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Сетевая ошибка';
    return { ok: false, status: 0, error: message };
  }
}

// Управление подключением Socket.io
let socketInstance: Socket | null = null;
function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (!isCustomBackendConfigured) return null;

  if (!socketInstance) {
    socketInstance = io(customApiUrl!, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketInstance.on('connect', () => {
      console.log('⚡ Socket.io подключен к Proxmox серверу:', socketInstance?.id);
    });
  }
  return socketInstance;
}

// Заголовки для HTTP-запросов к Proxmox серверу
function getAuthHeaders(): HeadersInit {
  const token = LocalStore.get<string | null>('app_token', null);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ==========================================
// API И SERVICE LAYER
// ==========================================
export const api = {
  auth: {
    async getCurrentUser(): Promise<User | null> {
      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const token = LocalStore.get<string | null>('app_token', null);
        if (!token) return null;
        try {
          const res = await fetch(`${customApiUrl}/api/auth/me`, {
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              const u = { ...data.user, token };
              LocalStore.set('app_user', u);
              return u;
            }
          }
        } catch (e) {
          console.warn('Ошибка проверки профиля на сервере:', e);
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь',
        };
      }

      // 3. Локальный режим
      return LocalStore.get<User | null>('app_user', null);
    },

    async signIn(email: string, pass: string): Promise<User> {
      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<{ user: User; token: string; error?: string }>(
          `${customApiUrl}/api/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
          }
        );
        if (res.ok && res.data?.user) {
          const user: User = { ...res.data.user, token: res.data.token };
          LocalStore.set('app_token', res.data.token);
          LocalStore.set('app_user', user);
          return user;
        }
        if (!res.ok && res.error) {
          throw new Error(res.error);
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) throw error;
        const u = data.user;
        const user: User = {
          id: u.id,
          email: u.email || email,
          name: u.user_metadata?.name || email.split('@')[0],
        };
        LocalStore.set('app_user', user);
        return user;
      }

      // 3. Локальный режим
      const mockUser: User = {
        id: 'user-current',
        name: email.split('@')[0] || 'Пользователь',
        email,
      };
      LocalStore.set('app_user', mockUser);
      return mockUser;
    },

    async signUp(name: string, email: string, pass: string): Promise<User> {
      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<{ user: User; token: string; error?: string }>(
          `${customApiUrl}/api/auth/register`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass }),
          }
        );
        if (res.ok && res.data?.user) {
          const user: User = { ...res.data.user, token: res.data.token };
          LocalStore.set('app_token', res.data.token);
          LocalStore.set('app_user', user);
          return user;
        }
        if (!res.ok && res.error) {
          throw new Error(res.error);
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { name } },
        });
        if (error) throw error;
        const u = data.user;
        const user: User = {
          id: u?.id || 'new-user',
          email,
          name,
        };
        LocalStore.set('app_user', user);
        return user;
      }

      // 3. Локальный режим
      const mockUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
      };
      LocalStore.set('app_user', mockUser);
      return mockUser;
    },

    async resetPassword(email: string): Promise<ResetRequestResult> {
      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<ResetRequestResult>(
          `${customApiUrl}/api/auth/forgot-password`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          }
        );
        if (res.ok && res.data) {
          return res.data;
        }
        // Если сервер вернул ошибку, не связанную с отсутствием маршрута (например не найден email)
        if (!res.ok && res.status !== 404 && res.error && !res.error.includes('<!DOCTYPE') && !res.error.includes('404')) {
          throw new Error(res.error);
        }
        // Если маршрута нет на удаленном сервере Proxmox (404/HTML), безопасно переключаемся на демо-токен
        console.warn('Сервер вернул статус сброса:', res.error);
        const demoToken = `token-${Date.now().toString(36)}`;
        LocalStore.set('app_reset_token', demoToken);
        return { sent: false, demoToken };
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        });
        if (error) throw error;
        return { sent: true };
      }

      // 3. Локальный режим (демо-токен)
      const token = `local-token-${Date.now()}`;
      LocalStore.set('app_reset_token', token);
      console.log(`🔑 [ДЕМО СБРОС] Токен для ${email}: ${token}`);
      return { sent: false, demoToken: token };
    },

    async confirmPasswordReset(token: string | null, newPassword: string): Promise<void> {
      // 1. Proxmox Backend
      if (isCustomBackendConfigured && token) {
        const res = await safeFetchJson<{ ok: boolean }>(
          `${customApiUrl}/api/auth/reset-password`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password: newPassword }),
          }
        );
        if (res.ok) return;
        if (!res.ok && res.status !== 404 && res.error && !res.error.includes('<!DOCTYPE')) {
          throw new Error(res.error || 'Не удалось изменить пароль');
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase && !token) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return;
      }

      // 3. Локальный режим
      LocalStore.set('app_reset_token', null);
    },

    async signOut(): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      LocalStore.set('app_user', null);
      LocalStore.set('app_token', null);
    },
  },

  tasks: {
    async getTasks(searchQuery: string = ''): Promise<TaskItem[]> {
      const localTasks = LocalStore.get<TaskItem[]>('app_tasks', INITIAL_TASKS);
      let serverTasks: TaskItem[] = [];

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<TaskItem[]>(
          `${customApiUrl}/api/tasks?q=${encodeURIComponent(searchQuery)}`,
          { headers: getAuthHeaders() }
        );
        if (res.ok && Array.isArray(res.data)) {
          serverTasks = res.data;
        }
      }

      // 2. Supabase
      if (!serverTasks.length && isSupabaseConfigured && supabase) {
        let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (searchQuery.trim()) {
          query = query.ilike('prompt', `%${searchQuery.trim()}%`);
        }
        interface SupabaseTaskRow {
          id: string;
          title?: string;
          author_name?: string;
          date_text?: string;
          prompt?: string;
          is_completed?: boolean;
          deadline_text?: string;
          expires_at?: string;
          comment_count?: number;
          completed_photo_url?: string;
          completed_at?: string;
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          serverTasks = (data as SupabaseTaskRow[]).map((d) => ({
            id: d.id,
            title: d.title || 'Задание',
            authorName: d.author_name || 'Автор',
            dateText: d.date_text || 'Сегодня',
            prompt: d.prompt || '',
            isCompleted: Boolean(d.is_completed),
            deadlineText: d.deadline_text || 'Выполнение до конца дня',
            expiresAt: d.expires_at,
            commentCount: d.comment_count || 0,
            completedPhotoUrl: d.completed_photo_url,
            completedAt: d.completed_at,
          }));
        }
      }

      // Объединяем задачи сервера и локального хранилища, чтобы локальные задания и выполненные фото никогда не пропадали
      const map = new Map<string, TaskItem>();
      for (const t of localTasks) {
        map.set(t.id, t);
      }
      for (const t of serverTasks) {
        const local = map.get(t.id);
        if (local && local.isCompleted && !t.isCompleted) {
          map.set(t.id, {
            ...t,
            isCompleted: true,
            completedPhotoUrl: local.completedPhotoUrl,
            completedAt: local.completedAt,
          });
        } else {
          map.set(t.id, t);
        }
      }

      let list = Array.from(map.values());
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase().replace(/^#/, '');
        list = list.filter(
          (t) =>
            t.authorName.toLowerCase().includes(q) ||
            t.prompt.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q)
        );
      }
      return list;
    },

    async createTask(
      prompt: string,
      deadlineText: string = 'Выполнение до конца дня',
      title: string = 'Задание',
      authorName?: string,
      durationHours: number = 3
    ): Promise<TaskItem> {
      const now = new Date();
      const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();
      const currentUser = LocalStore.get<User | null>('app_user', null);
      const finalAuthor = authorName || currentUser?.name || 'Я';

      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title,
        authorName: finalAuthor,
        dateText,
        prompt,
        isCompleted: false,
        deadlineText,
        expiresAt,
        commentCount: 0,
      };

      // Всегда сохраняем в локальный кэш
      const localTasks = LocalStore.get<TaskItem[]>('app_tasks', INITIAL_TASKS);
      LocalStore.set('app_tasks', [newTask, ...localTasks]);

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<TaskItem>(`${customApiUrl}/api/tasks`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ title, prompt, deadlineText, authorName: finalAuthor, durationHours }),
        });
        if (res.ok && res.data) {
          return res.data;
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('tasks').insert({
          title,
          author_name: finalAuthor,
          date_text: dateText,
          prompt,
          is_completed: false,
          deadline_text: deadlineText,
          expires_at: expiresAt,
          comment_count: 0,
        }).select().single();
        if (data) return data;
      }

      return newTask;
    },

    // Запуск случайного челленджа дня (BeReal дроп)
    async triggerDailyDrop(durationHours: number = 3): Promise<TaskItem> {
      const randomPrompt = PHOTO_CHALLENGES_BANK[Math.floor(Math.random() * PHOTO_CHALLENGES_BANK.length)];
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();
      const deadlineText = `До ${new Date(expiresAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

      const dropTask: TaskItem = {
        id: `task-drop-${Date.now()}`,
        title: '⚡ Задание дня',
        authorName: 'Система',
        dateText: 'Сегодня',
        prompt: randomPrompt,
        isCompleted: false,
        deadlineText,
        expiresAt,
        commentCount: 0,
      };

      // Сохраняем локально
      const localTasks = LocalStore.get<TaskItem[]>('app_tasks', INITIAL_TASKS);
      LocalStore.set('app_tasks', [dropTask, ...localTasks]);

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<TaskItem>(`${customApiUrl}/api/challenges/trigger-drop`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ durationHours }),
        });
        if (res.ok) {
          const tasks = await this.getTasks();
          return tasks[0] || dropTask;
        } else {
          // Если trigger-drop недоступен (404), отправляем обычное создание задания
          await safeFetchJson<TaskItem>(`${customApiUrl}/api/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              title: '⚡ Задание дня',
              prompt: randomPrompt,
              deadlineText,
              authorName: 'Система',
              durationHours,
            }),
          });
        }
      }

      return dropTask;
    },

    async submitTaskProof(taskId: string, photoDataUrl: string): Promise<TaskItem> {
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('ru-RU')}, ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

      // Обновляем локально всегда
      const tasks = LocalStore.get<TaskItem[]>('app_tasks', INITIAL_TASKS);
      const updated = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            isCompleted: true,
            completedPhotoUrl: photoDataUrl,
            completedAt: timeStr,
          };
        }
        return t;
      });
      LocalStore.set('app_tasks', updated);
      const updatedTask = updated.find((t) => t.id === taskId) || {
        id: taskId,
        title: 'Задание',
        authorName: 'Я',
        dateText: 'Сегодня',
        prompt: 'Фото отчет',
        isCompleted: true,
        deadlineText: 'Выполнено',
        commentCount: 0,
        completedPhotoUrl: photoDataUrl,
        completedAt: timeStr,
      };

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<TaskItem>(`${customApiUrl}/api/tasks/${taskId}/proof`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ photoDataUrl }),
        });
        if (res.ok && res.data) return res.data;
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from('tasks')
          .update({
            is_completed: true,
            completed_photo_url: photoDataUrl,
            completed_at: timeStr,
          })
          .eq('id', taskId)
          .select()
          .single();
        if (data) return data;
      }

      return updatedTask;
    },

    async getComments(taskId: string): Promise<TaskComment[]> {
      const localMap = LocalStore.get<Record<string, TaskComment[]>>('app_comments', {
        'task-1': [
          {
            id: 'c1',
            taskId: 'task-1',
            authorName: 'Друг 1',
            text: 'Где тут найти чистое небо?))',
            createdAt: '12:30',
          },
          {
            id: 'c2',
            taskId: 'task-1',
            authorName: 'Друг 5',
            text: 'Выйди на улицу или балкон!',
            createdAt: '12:45',
          },
        ],
        'task-feed-1': [
          {
            id: 'c-f1',
            taskId: 'task-feed-1',
            authorName: 'Алексей',
            text: 'Отличный ракурс капель воды!',
            createdAt: '11:20',
          },
          {
            id: 'c-f2',
            taskId: 'task-feed-1',
            authorName: 'Дмитрий',
            text: 'Красиво получилось 👍',
            createdAt: '11:25',
          },
        ],
        'task-2': [
          {
            id: 'c-2-1',
            taskId: 'task-2',
            authorName: 'Мария',
            text: 'Это где такая улица?',
            createdAt: '14:35',
          },
          {
            id: 'c-2-2',
            taskId: 'task-2',
            authorName: 'Алексей',
            text: 'Рядом с универом)',
            createdAt: '14:40',
          },
        ],
      });

      const localList = localMap[taskId] || [];

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<TaskComment[]>(`${customApiUrl}/api/tasks/${taskId}/comments`);
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          const ids = new Set(res.data.map((c) => c.id));
          const extra = localList.filter((c) => !ids.has(c.id));
          return [...res.data, ...extra];
        }
      }

      return localList;
    },

    async addComment(taskId: string, authorName: string, text: string): Promise<TaskComment> {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const newComment: TaskComment = {
        id: `comm-${Date.now()}`,
        taskId,
        authorName,
        text,
        createdAt: timeStr,
      };

      // Всегда сохраняем комментарий локально
      const allComments = LocalStore.get<Record<string, TaskComment[]>>('app_comments', {});
      const taskComments = allComments[taskId] || [];
      allComments[taskId] = [...taskComments, newComment];
      LocalStore.set('app_comments', allComments);

      // Увеличиваем счетчик комментариев на задании в локальном кэше
      const tasks = LocalStore.get<TaskItem[]>('app_tasks', INITIAL_TASKS);
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t
      );
      LocalStore.set('app_tasks', updatedTasks);

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<TaskComment>(`${customApiUrl}/api/tasks/${taskId}/comments`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ authorName, text }),
        });
        if (res.ok && res.data) {
          return res.data;
        }
      }

      return newComment;
    },

    onNewChallenge(callback: (task: TaskItem) => void): () => void {
      if (isCustomBackendConfigured) {
        const socket = getSocket();
        if (socket) {
          const handler = (task: TaskItem) => {
            callback(task);
          };
          socket.on('new_challenge', handler);
          return () => {
            socket.off('new_challenge', handler);
          };
        }
      }
      return () => {};
    },
  },

  chat: {
    // Получить список зарегистрированных пользователей для выбора друга
    async getUsers(): Promise<UserSummary[]> {
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<UserSummary[]>(`${customApiUrl}/api/users`, {
          headers: getAuthHeaders(),
        });
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      }
      return [
        { id: 'u-1', name: 'Друг 1', email: 'friend1@example.com' },
        { id: 'u-2', name: 'Друг 2', email: 'friend2@example.com' },
        { id: 'u-3', name: 'Алексей', email: 'alex@example.com' },
        { id: 'u-4', name: 'Мария', email: 'maria@example.com' },
        { id: 'u-5', name: 'Друг 5', email: 'friend5@example.com' },
      ];
    },

    async createConversation(friendId?: string, friendName?: string): Promise<ConversationItem> {
      let finalId = friendId;
      let finalName = friendName;
      if (!friendName && friendId) {
        finalName = friendId;
        finalId = undefined;
      }
      const safeFriendName = finalName || 'Друг';
      const safeFriendId = finalId || `friend-${Date.now()}`;

      const now = new Date();
      const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<ConversationItem>(`${customApiUrl}/api/conversations`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ friendId: finalId, friendName: safeFriendName }),
        });
        if (res.ok && res.data) {
          return res.data;
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const id = `conv-${Date.now()}`;
        await supabase.from('conversations').insert({
          id,
          friend_id: safeFriendId,
          friend_name: safeFriendName,
          last_message: 'Чат создан',
          date_text: dateText,
          time_text: timeText,
        });
        return {
          id,
          friendId: safeFriendId,
          friendName: safeFriendName,
          dateText,
          timeText,
          lastMessage: 'Чат создан',
          unread: false,
        };
      }

      // 3. Локальный режим
      const newConv: ConversationItem = {
        id: `conv-${Date.now()}`,
        friendId: safeFriendId,
        friendName: safeFriendName,
        dateText,
        timeText,
        lastMessage: 'Чат создан',
        unread: false,
      };

      const convs = LocalStore.get<ConversationItem[]>('app_conversations', INITIAL_CONVERSATIONS);
      LocalStore.set('app_conversations', [newConv, ...convs]);
      return newConv;
    },

    async getConversations(): Promise<ConversationItem[]> {
      const localConvs = LocalStore.get<ConversationItem[]>('app_conversations', INITIAL_CONVERSATIONS);

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<ConversationItem[]>(`${customApiUrl}/api/conversations`, {
          headers: getAuthHeaders(),
        });
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          const map = new Map<string, ConversationItem>();
          for (const c of localConvs) map.set(c.id, c);
          for (const c of res.data) map.set(c.id, c);
          return Array.from(map.values());
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('conversations').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      }

      // 3. Локальный режим
      return localConvs;
    },

    async getMessages(chatId: string): Promise<ChatMessage[]> {
      const store = LocalStore.get<Record<string, ChatMessage[]>>('app_messages', INITIAL_MESSAGES);
      const localList = store[chatId] || [];

      // 1. Proxmox Backend
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<ChatMessage[]>(`${customApiUrl}/api/messages/${chatId}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok && Array.isArray(res.data)) {
          const currentUser = LocalStore.get<User | null>('app_user', null);
          const mapped = res.data.map((m) => ({
            ...m,
            isOutgoing: currentUser ? String(m.senderId) === String(currentUser.id) : m.isOutgoing,
          }));
          if (mapped.length > 0) return mapped;
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        if (!error && data) return data;
      }

      // 3. Локальный режим
      return localList.length > 0 ? localList : [
        {
          id: `m-init-${chatId}`,
          chatId,
          senderId: 'friend',
          senderName: 'Друг',
          text: 'Привет! Какое сегодня задание на фото?',
          timeText: '12:00',
          isOutgoing: false,
        },
      ];
    },

    async sendMessage(chatId: string, text: string, photoUrl?: string): Promise<ChatMessage> {
      const now = new Date();
      const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const currentUser = LocalStore.get<User | null>('app_user', null);

      // 1. Proxmox Backend (отправка с настоящим senderId пользователя)
      if (isCustomBackendConfigured) {
        const res = await safeFetchJson<ChatMessage>(`${customApiUrl}/api/messages`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            chatId,
            text,
            photoUrl,
            senderId: currentUser?.id,
            senderName: currentUser?.name || 'Я',
          }),
        });
        if (res.ok && res.data) {
          return { ...res.data, isOutgoing: true };
        }
      }

      // 2. Supabase
      if (isSupabaseConfigured && supabase) {
        await supabase.from('messages').insert({
          chat_id: chatId,
          text,
          photo_url: photoUrl,
          sender_id: currentUser?.id || 'current-user',
          sender_name: currentUser?.name || 'Я',
          time_text: timeText,
          created_at: new Date().toISOString(),
        });
      }

      // 3. Локальный режим
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        chatId,
        senderId: currentUser?.id || 'current-user',
        senderName: currentUser?.name || 'Я',
        text,
        photoUrl,
        timeText,
        isOutgoing: true,
      };

      const store = LocalStore.get<Record<string, ChatMessage[]>>('app_messages', INITIAL_MESSAGES);
      store[chatId] = [...(store[chatId] || []), newMsg];
      LocalStore.set('app_messages', store);

      // Обновляем превью в списке диалогов
      const convs = LocalStore.get<ConversationItem[]>('app_conversations', INITIAL_CONVERSATIONS);
      const updatedConvs = convs.map((c) =>
        c.id === chatId ? { ...c, lastMessage: text, timeText } : c
      );
      LocalStore.set('app_conversations', updatedConvs);

      return newMsg;
    },

    // Подписка на сообщения: через Socket.io для Proxmox, Realtime для Supabase, EventListener для локала
    subscribe(chatId: string, callback: (msg: ChatMessage) => void): () => void {
      // 1. Proxmox Socket.io
      if (isCustomBackendConfigured) {
        const socket = getSocket();
        if (socket) {
          socket.emit('join_chat', chatId);

          const messageHandler = (msg: ChatMessage) => {
            if (msg.chatId === chatId) {
              const currentUser = LocalStore.get<User | null>('app_user', null);
              const isOutgoing = currentUser ? String(msg.senderId) === String(currentUser.id) : false;
              callback({ ...msg, isOutgoing });
            }
          };

          socket.on('new_message', messageHandler);

          return () => {
            socket.emit('leave_chat', chatId);
            socket.off('new_message', messageHandler);
          };
        }
      }

      // 2. Supabase Realtime
      if (isSupabaseConfigured && supabase) {
        const client = supabase;
        const channel = client
          .channel(`chat:${chatId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
            (payload) => {
              const row = payload.new;
              const currentUser = LocalStore.get<User | null>('app_user', null);
              const isOutgoing = currentUser ? String(row.sender_id) === String(currentUser.id) : false;
              callback({
                id: row.id,
                chatId: row.chat_id,
                senderId: String(row.sender_id),
                senderName: row.sender_name || 'Друг',
                text: row.text,
                photoUrl: row.photo_url,
                timeText: new Date(row.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                isOutgoing,
              });
            }
          )
          .subscribe();

        return () => {
          client.removeChannel(channel);
        };
      }

      // 3. Локальный мок
      const handler = (e: Event) => {
        const customEvent = e as CustomEvent<ChatMessage>;
        if (customEvent.detail?.chatId === chatId) {
          callback(customEvent.detail);
        }
      };
      window.addEventListener('mock-message-sent', handler);
      return () => window.removeEventListener('mock-message-sent', handler);
    },
  },

  notifications: {
    async getNotifications(): Promise<AppNotification[]> {
      return LocalStore.get<AppNotification[]>('app_notifications', INITIAL_NOTIFICATIONS);
    },
  },
};
