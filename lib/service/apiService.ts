import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { User, TaskItem, TaskComment, ConversationItem, ChatMessage, AppNotification } from '../types';

export const customApiUrl = process.env.NEXT_PUBLIC_API_URL;
export const isCustomBackendConfigured = Boolean(
  customApiUrl && customApiUrl.startsWith('http')
);

// Начальные данные из макета Figma
const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Задание',
    authorName: 'Автор',
    dateText: '20 сентября 2026',
    prompt: 'Сфотографируй воду',
    isCompleted: false,
    deadlineText: 'Выполнение до 21.09',
    commentCount: 4,
  },
  {
    id: 'task-2',
    title: 'Задание',
    authorName: 'Автор',
    dateText: '20 сентября 2026',
    prompt: 'Сфотографируй улицу',
    isCompleted: true,
    deadlineText: 'Выполнение до 21.09',
    commentCount: 1,
    completedPhotoUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60',
    completedAt: '20.09.2026, 14:30',
  },
  {
    id: 'task-3',
    title: 'Задание',
    authorName: 'Автор',
    dateText: '20 сентября 2026',
    prompt: 'Сфоткай пляж',
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
    dateText: '20 сентября 2026',
    timeText: '13:20',
    lastMessage: 'Привет!!',
    unread: false,
  },
  {
    id: 'conv-2',
    friendId: 'user-5',
    friendName: 'Друг 5',
    dateText: '18 сентября 2026',
    timeText: '19:00',
    lastMessage: 'Ты спишь?',
    unread: true,
  },
  {
    id: 'conv-3',
    friendId: 'user-12',
    friendName: 'Друг 12',
    dateText: '12 сентября 2026',
    timeText: '3-12',
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
      text: '-Привет',
      timeText: '12:00',
      isOutgoing: false,
    },
    {
      id: 'm2',
      chatId: 'conv-1',
      senderId: 'current-user',
      senderName: 'Я',
      text: '-Привет',
      timeText: '12:00',
      isOutgoing: true,
    },
  ],
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Новое задание!',
    description: 'Вам назначено задание "Сфотографируй воду"',
    timeText: '10 мин назад',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Новое сообщение',
    description: 'Друг 1 отправил вам сообщение',
    timeText: '1 час назад',
    read: true,
  },
];

// Локальное хранилище данных (для моментального офлайн/браузерного тестирования до подключения ключей)
class LocalStore {
  static get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }
}

// ==========================================
// Service / Repository Implementation
// ==========================================
export const api = {
  auth: {
    async getCurrentUser(): Promise<User | null> {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь',
        };
      }
      return LocalStore.get<User | null>('app_user', {
        id: 'user-current',
        name: 'Пользователь',
        email: 'user@example.com',
      });
    },

    async signIn(email: string, pass: string): Promise<User> {
      if (isCustomBackendConfigured) {
        const res = await fetch(`${customApiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Ошибка входа');
        const user: User = json.user;
        LocalStore.set('app_user', user);
        return user;
      }

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
      // Mock sign in
      const mockUser: User = {
        id: 'user-current',
        name: email.split('@')[0] || 'Пользователь',
        email,
      };
      LocalStore.set('app_user', mockUser);
      return mockUser;
    },

    async signUp(name: string, email: string, pass: string): Promise<User> {
      if (isCustomBackendConfigured) {
        const res = await fetch(`${customApiUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: pass }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Ошибка регистрации');
        const user: User = json.user;
        LocalStore.set('app_user', user);
        return user;
      }

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
      const mockUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
      };
      LocalStore.set('app_user', mockUser);
      return mockUser;
    },

    async resetPassword(email: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return;
      }
      console.log(`[Mock Auth] Reset link sent to ${email}`);
    },

    async signOut(): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      LocalStore.set('app_user', null);
    },
  },

  tasks: {
    async getTasks(searchFriendQuery: string = ''): Promise<TaskItem[]> {
      if (isCustomBackendConfigured) {
        try {
          const res = await fetch(`${customApiUrl}/api/tasks?q=${encodeURIComponent(searchFriendQuery)}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend fetch error', e);
        }
      }

      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (searchFriendQuery.trim()) {
          query = query.ilike('author_name', `%${searchFriendQuery.trim()}%`);
        }
        interface SupabaseTaskRow {
          id: string;
          title?: string;
          author_name?: string;
          date_text?: string;
          prompt?: string;
          is_completed?: boolean;
          deadline_text?: string;
          comment_count?: number;
          completed_photo_url?: string;
          completed_at?: string;
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return (data as SupabaseTaskRow[]).map((d) => ({
            id: d.id,
            title: d.title || 'Задание',
            authorName: d.author_name || 'Автор',
            dateText: d.date_text || '20 сентября 2026',
            prompt: d.prompt || '',
            isCompleted: Boolean(d.is_completed),
            deadlineText: d.deadline_text || 'Выполнение до 21.09',
            commentCount: d.comment_count || 0,
            completedPhotoUrl: d.completed_photo_url,
            completedAt: d.completed_at,
          }));
        }
      }

      // Local mock fallback
      let list = LocalStore.get<TaskItem[]>('app_tasks', INITIAL_TASKS);
      if (searchFriendQuery.trim()) {
        const q = searchFriendQuery.trim().toLowerCase().replace(/^#/, '');
        list = list.filter(
          (t) =>
            t.authorName.toLowerCase().includes(q) ||
            t.prompt.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q)
        );
      }
      return list;
    },

    async submitTaskProof(taskId: string, photoDataUrl: string): Promise<TaskItem> {
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('ru-RU')}, ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

      if (isCustomBackendConfigured) {
        try {
          const res = await fetch(`${customApiUrl}/api/tasks/${taskId}/proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoDataUrl }),
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend proof submit error', e);
        }
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('tasks')
          .update({
            is_completed: true,
            completed_photo_url: photoDataUrl,
            completed_at: timeStr,
          })
          .eq('id', taskId)
          .select()
          .single();
        if (!error && data) return data;
      }

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
      return updated.find((t) => t.id === taskId)!;
    },

    async getComments(taskId: string): Promise<TaskComment[]> {
      if (isCustomBackendConfigured) {
        try {
          const res = await fetch(`${customApiUrl}/api/tasks/${taskId}/comments`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend get comments error', e);
        }
      }

      const allComments = LocalStore.get<Record<string, TaskComment[]>>('app_comments', {
        'task-1': [
          {
            id: 'c1',
            taskId: 'task-1',
            authorName: 'Друг 1',
            text: 'Где тут найти чистую воду?))',
            createdAt: '12:30',
          },
          {
            id: 'c2',
            taskId: 'task-1',
            authorName: 'Друг 5',
            text: 'На набережной сфоткай!',
            createdAt: '12:45',
          },
        ],
      });
      return allComments[taskId] || [];
    },

    async addComment(taskId: string, authorName: string, text: string): Promise<TaskComment> {
      if (isCustomBackendConfigured) {
        try {
          const res = await fetch(`${customApiUrl}/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authorName, text }),
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend add comment error', e);
        }
      }

      const allComments = LocalStore.get<Record<string, TaskComment[]>>('app_comments', {});
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const newComment: TaskComment = {
        id: `comm-${Date.now()}`,
        taskId,
        authorName,
        text,
        createdAt: timeStr,
      };

      const taskComments = allComments[taskId] || [];
      allComments[taskId] = [...taskComments, newComment];
      LocalStore.set('app_comments', allComments);

      // Increment count on task
      const tasks = LocalStore.get<TaskItem[]>('app_tasks', INITIAL_TASKS);
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, commentCount: t.commentCount + 1 } : t
      );
      LocalStore.set('app_tasks', updatedTasks);

      return newComment;
    },

    async createTask(prompt: string, deadlineText: string = 'Выполнение до 30.09', title: string = 'Задание', authorName: string = 'Я'): Promise<TaskItem> {
      const now = new Date();
      const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title,
        authorName,
        dateText,
        prompt,
        isCompleted: false,
        deadlineText,
        commentCount: 0,
      };

      if (isCustomBackendConfigured) {
        try {
          const res = await fetch(`${customApiUrl}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, prompt, deadlineText, authorName }),
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend create task error', e);
        }
      }

      if (isSupabaseConfigured && supabase) {
        await supabase.from('tasks').insert({
          title,
          author_name: authorName,
          date_text: dateText,
          prompt,
          is_completed: false,
          deadline_text: deadlineText,
          comment_count: 0,
        });
      }

      const tasks = LocalStore.get<TaskItem[]>('app_tasks', INITIAL_TASKS);
      LocalStore.set('app_tasks', [newTask, ...tasks]);
      return newTask;
    },
  },

  chat: {
    async createConversation(friendName: string): Promise<ConversationItem> {
      const now = new Date();
      const dateText = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const newConv: ConversationItem = {
        id: `conv-${Date.now()}`,
        friendId: `friend-${Date.now()}`,
        friendName,
        dateText,
        timeText,
        lastMessage: 'Чат создан',
        unread: false,
      };

      if (isCustomBackendConfigured) {
        try {
          const res = await fetch(`${customApiUrl}/api/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendName }),
          });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend create conversation error', e);
        }
      }

      if (isSupabaseConfigured && supabase) {
        await supabase.from('conversations').insert({
          id: newConv.id,
          friend_name: friendName,
          last_message: newConv.lastMessage,
          date_text: dateText,
          time_text: timeText,
        });
      }

      const convs = LocalStore.get<ConversationItem[]>('app_conversations', INITIAL_CONVERSATIONS);
      LocalStore.set('app_conversations', [newConv, ...convs]);
      return newConv;
    },

    async getConversations(): Promise<ConversationItem[]> {
      if (isCustomBackendConfigured) {
        try {
          const res = await fetch(`${customApiUrl}/api/conversations`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend get conversations error', e);
        }
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('conversations').select('*');
        if (!error && data && data.length > 0) return data;
      }
      return LocalStore.get<ConversationItem[]>('app_conversations', INITIAL_CONVERSATIONS);
    },

    async getMessages(chatId: string): Promise<ChatMessage[]> {
      if (isCustomBackendConfigured) {
        try {
          const res = await fetch(`${customApiUrl}/api/messages/${chatId}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend get messages error', e);
        }
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        if (!error && data) return data;
      }
      const store = LocalStore.get<Record<string, ChatMessage[]>>('app_messages', INITIAL_MESSAGES);
      return store[chatId] || [
        {
          id: `m-init-${chatId}`,
          chatId,
          senderId: 'friend',
          senderName: 'Друг',
          text: '-Привет! Как успехи с заданием?',
          timeText: '12:00',
          isOutgoing: false,
        },
      ];
    },

    async sendMessage(chatId: string, text: string, photoUrl?: string): Promise<ChatMessage> {
      const now = new Date();
      const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        chatId,
        senderId: 'current-user',
        senderName: 'Я',
        text,
        photoUrl,
        timeText,
        isOutgoing: true,
      };

      if (isCustomBackendConfigured) {
        try {
          await fetch(`${customApiUrl}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, text, photoUrl, senderId: 'current-user', senderName: 'Я' }),
          });
        } catch (e) {
          console.warn('Backend send message error', e);
        }
      }

      if (isSupabaseConfigured && supabase) {
        await supabase.from('messages').insert({
          chat_id: chatId,
          text,
          photo_url: photoUrl,
          created_at: new Date().toISOString(),
        });
      }

      const store = LocalStore.get<Record<string, ChatMessage[]>>('app_messages', INITIAL_MESSAGES);
      store[chatId] = [...(store[chatId] || []), newMsg];
      LocalStore.set('app_messages', store);

      // Обновим последнее сообщение в списке диалогов
      const convs = LocalStore.get<ConversationItem[]>('app_conversations', INITIAL_CONVERSATIONS);
      const updatedConvs = convs.map((c) =>
        c.id === chatId ? { ...c, lastMessage: text, timeText } : c
      );
      LocalStore.set('app_conversations', updatedConvs);

      return newMsg;
    },

    // Реализация подписки: в Supabase через Realtime channel, в локальном моке через EventListener
    subscribe(chatId: string, callback: (msg: ChatMessage) => void): () => void {
      if (isSupabaseConfigured && supabase) {
        const channel = supabase
          .channel(`chat:${chatId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
            (payload) => {
              const row = payload.new;
              callback({
                id: row.id,
                chatId: row.chat_id,
                senderId: row.sender_id,
                senderName: 'Друг',
                text: row.text,
                timeText: new Date(row.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                isOutgoing: false,
              });
            }
          )
          .subscribe();

        return () => {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        };
      }

      // Mock subscription listener
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
