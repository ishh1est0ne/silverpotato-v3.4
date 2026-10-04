'use client';

import React, { useState, useEffect } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

import { BottomNav, AppTab } from '@/components/ui/BottomNav';
import { SearchBar } from '@/components/ui/SearchBar';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { CommentsModal } from '@/components/tasks/CommentsModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';

import { ConversationCard } from '@/components/chat/ConversationCard';
import { ChatScreen } from '@/components/chat/ChatScreen';
import { NewChatModal } from '@/components/chat/NewChatModal';

import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { NotificationsScreen } from '@/components/notifications/NotificationsScreen';
import { PostsFeedScreen } from '@/components/posts/PostsFeedScreen';

import { TaskItem, ConversationItem, User } from '@/lib/types';
import { api } from '@/lib/service/apiService';
import { triggerHaptic, sendLocalPush } from '@/lib/native';
import { Smartphone, Monitor, Plus, MessageSquarePlus, Zap } from 'lucide-react';

export default function App() {
  // Режим экрана: авторизация или главное приложение (по умолчанию: Вход / Log In)
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot' | 'reset' | null>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Сообщения при успешной регистрации
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);

  // Таб навигации и подрежим заданий (задания дня / лента выполненных постов)
  const [activeTab, setActiveTab] = useState<AppTab>('tasks');
  const [taskSubView, setTaskSubView] = useState<'tasks' | 'feed'>('tasks');

  // Данные заданий
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<TaskItem | null>(null);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<TaskItem | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Данные чатов
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Режим отображения для десктопа (телефонная рамка / во весь экран)
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Загрузка начальных данных
  const refreshData = async () => {
    const user = await api.auth.getCurrentUser();
    setCurrentUser(user);

    const taskList = await api.tasks.getTasks(searchQuery);
    setTasks(taskList);

    const convList = await api.chat.getConversations();
    setConversations(convList);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const user = await api.auth.getCurrentUser();
      const taskList = await api.tasks.getTasks('');
      const convList = await api.chat.getConversations();
      if (isMounted) {
        setCurrentUser(user);
        setTasks(taskList);
        setConversations(convList);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const token = params.get('reset') || params.get('token');
          if (token) {
            setResetToken(token);
            setAuthView('reset');
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Поиск по заданиям при изменении строки
  useEffect(() => {
    let isMounted = true;
    api.tasks.getTasks(searchQuery).then((res) => {
      if (isMounted) setTasks(res);
    });
    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  const handleTaskUpdated = (updated: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTaskForModal(null);
  };

  const handleCommentsUpdated = (taskId?: string) => {
    if (taskId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t))
      );
    }
    api.tasks.getTasks(searchQuery).then((fresh) => {
      setTasks((prev) => {
        const freshMap = new Map(fresh.map((f) => [f.id, f]));
        const merged = prev.map((p) => freshMap.get(p.id) || p);
        for (const f of fresh) {
          if (!prev.some((p) => p.id === f.id)) merged.unshift(f);
        }
        return merged;
      });
    });
  };

  const handleTriggerDrop = async () => {
    setIsDropping(true);
    triggerHaptic('medium');
    try {
      const dropTask = await api.tasks.triggerDailyDrop(3);
      await triggerHaptic('success');
      await sendLocalPush('⚡ Новое задание дня!', dropTask.prompt);
      setTasks((prev) => [dropTask, ...prev]);
    } catch (e) {
      console.error('Ошибка вызова дропа:', e);
      triggerHaptic('error');
    } finally {
      setIsDropping(false);
    }
  };

  const handleOpenChat = (conv: ConversationItem) => {
    triggerHaptic('select');
    setActiveChat(conv);
  };

  const handleLogout = async () => {
    triggerHaptic('light');
    await api.auth.signOut();
    setCurrentUser(null);
    setAuthView('login');
  };

  // ==========================================
  // Рендер экранов авторизации
  // ==========================================
  const renderAuthScreens = () => {
    if (authView === 'reset') {
      return (
        <AuthLayout title="Новый пароль">
          <ResetPasswordForm
            token={resetToken}
            onDone={() => {
              setRegistrationNotice('Пароль успешно изменен! Выполните вход.');
              setAuthView('login');
            }}
            onCancel={() => setAuthView('login')}
          />
        </AuthLayout>
      );
    }

    if (authView === 'signup') {
      return (
        <AuthLayout title="Регистрация">
          <SignUpForm
            onSuccess={(email) => {
              setRegisteredEmail(email);
              setRegistrationNotice('Регистрация прошла успешно! Теперь выполните вход.');
              setAuthView('login');
            }}
            onNavigateToLogin={() => {
              setRegistrationNotice(null);
              setAuthView('login');
            }}
          />
        </AuthLayout>
      );
    }

    if (authView === 'forgot') {
      return (
        <AuthLayout title="Сброс пароля">
          <ForgotPasswordForm
            onNavigateToLogin={() => setAuthView('login')}
            onNavigateToReset={(token) => {
              setResetToken(token);
              setAuthView('reset');
            }}
          />
        </AuthLayout>
      );
    }

    // По умолчанию: Login (Вход)
    return (
      <AuthLayout title="Вход">
        <LoginForm
          initialEmail={registeredEmail}
          successNotice={registrationNotice}
          onSuccess={() => {
            setRegistrationNotice(null);
            setAuthView(null);
            refreshData();
          }}
          onNavigateToSignUp={() => {
            setRegistrationNotice(null);
            setAuthView('signup');
          }}
          onNavigateToForgotPassword={() => {
            setRegistrationNotice(null);
            setAuthView('forgot');
          }}
        />
      </AuthLayout>
    );
  };

  // ==========================================
  // Рендер основного приложения (Фиолетовый фон #5216e8)
  // ==========================================
  const renderMainApp = () => {
    // Если открыт конкретный чат
    if (activeChat) {
      return (
        <div className="w-full h-full flex flex-col bg-[#5216e8]">
          <ChatScreen
            conversation={activeChat}
            onBack={() => {
              triggerHaptic('select');
              setActiveChat(null);
              api.chat.getConversations().then(setConversations);
            }}
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col bg-[#5216e8] relative overflow-hidden">
        {/* Скроллируемая область контента */}
        <div className="flex-1 overflow-y-auto pt-[max(0.75rem,env(safe-area-inset-top))] px-4 pb-4">
          {/* Вкладка 1: Экран Заданий и Ленты постов */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-3 py-2">
              {/* Переключатель: Задания / Лента постов */}
              <div className="flex bg-[#3b0fb3] p-1 rounded-2xl gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('select');
                    setTaskSubView('tasks');
                  }}
                  className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    taskSubView === 'tasks'
                      ? 'bg-white text-[#5216e8] shadow'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <span>🎯 Задания дня</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('select');
                    setTaskSubView('feed');
                  }}
                  className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    taskSubView === 'feed'
                      ? 'bg-white text-[#5216e8] shadow'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <span>📸 Лента постов</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans font-semibold ${
                      taskSubView === 'feed' ? 'bg-[#5216e8] text-white' : 'bg-white/20 text-stone-200'
                    }`}
                  >
                    {tasks.filter((t) => t.isCompleted && t.completedPhotoUrl).length}
                  </span>
                </button>
              </div>

              {taskSubView === 'feed' ? (
                <PostsFeedScreen
                  tasks={tasks}
                  currentUser={currentUser}
                  onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                  onCommentsUpdated={handleCommentsUpdated}
                />
              ) : (
                <>
                  {/* Поисковая строка и кнопка добавления задания */}
                  <div className="flex items-center gap-2">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="#имя друга"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('select');
                        setIsCreateTaskOpen(true);
                      }}
                      className="w-12 h-12 bg-white text-[#5216e8] hover:bg-stone-100 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                      title="Создать задание"
                    >
                      <Plus size={24} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Кнопка случайного фото-челленджа дня (BeReal стиль) */}
                  <button
                    type="button"
                    onClick={handleTriggerDrop}
                    disabled={isDropping}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.98] text-stone-900 rounded-2xl font-mono text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                  >
                    <Zap size={16} className="fill-stone-900" />
                    {isDropping ? 'Генерация задания...' : '⚡ Случайный дроп дня (BeReal)'}
                  </button>

                  {/* Список карточек заданий */}
                  <div className="flex flex-col gap-3.5">
                    {tasks.length === 0 ? (
                      <div className="bg-white/90 rounded-3xl p-6 text-center text-stone-500 font-mono text-sm shadow">
                        Заданий не найдено
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onOpenTaskModal={(t) => {
                            triggerHaptic('select');
                            setSelectedTaskForModal(t);
                          }}
                          onOpenComments={(t) => {
                            triggerHaptic('select');
                            setSelectedTaskForComments(t);
                          }}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Вкладка 2: Экран Сообщений (Figma Screen 15) */}
          {activeTab === 'messages' && (
            <div className="flex flex-col gap-4 py-2">
              {/* Хедер баннер с кнопкой создания чата */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#c6baf9] text-stone-900 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-md">
                  Твои сообщения
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('select');
                    setIsNewChatOpen(true);
                  }}
                  className="w-11 h-11 bg-white text-[#5216e8] hover:bg-stone-100 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
                  title="Начать чат с другом"
                >
                  <MessageSquarePlus size={22} strokeWidth={2.2} />
                </button>
              </div>

              {/* Список карточек диалогов */}
              <div className="flex flex-col gap-3.5">
                {conversations.map((conv) => (
                  <ConversationCard
                    key={conv.id}
                    conversation={conv}
                    onOpenChat={handleOpenChat}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Вкладка 3: Профиль */}
          {activeTab === 'profile' && (
            <ProfileScreen user={currentUser} onLogout={handleLogout} />
          )}

          {/* Вкладка 4: Уведомления */}
          {activeTab === 'notifications' && <NotificationsScreen />}
        </div>

        {/* Нижняя навигационная панель */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setActiveChat(null);
          }}
          unreadMessages={conversations.filter((c) => c.unread).length}
          unreadNotifications={1}
        />

        {/* Модальное окно сдачи задания */}
        {selectedTaskForModal && (
          <TaskModal
            task={selectedTaskForModal}
            onClose={() => setSelectedTaskForModal(null)}
            onTaskUpdated={handleTaskUpdated}
          />
        )}

        {/* Модальное окно создания задания */}
        {isCreateTaskOpen && (
          <CreateTaskModal
            onClose={() => setIsCreateTaskOpen(false)}
            onTaskCreated={(newTask) => {
              setTasks((prev) => [newTask, ...prev]);
            }}
          />
        )}

        {/* Модальное окно нового чата */}
        {isNewChatOpen && (
          <NewChatModal
            onClose={() => setIsNewChatOpen(false)}
            onChatCreated={(newConv) => {
              setConversations((prev) => [newConv, ...prev]);
              setActiveChat(newConv);
            }}
          />
        )}

        {/* Модальное окно комментариев (КОММ) */}
        {selectedTaskForComments && (
          <CommentsModal
            task={selectedTaskForComments}
            onClose={() => setSelectedTaskForComments(null)}
            onCommentsUpdated={handleCommentsUpdated}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-0 md:p-6 text-stone-100">
      {/* Панель быстрого переключения экранов */}
      <header className="w-full max-w-lg mb-3 px-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-stone-400">Экран:</span>
          <button
            onClick={() => {
              triggerHaptic('select');
              setAuthView('login');
              setActiveChat(null);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              authView === 'login' ? 'bg-[#5516ea] text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => {
              triggerHaptic('select');
              setAuthView('signup');
              setActiveChat(null);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              authView === 'signup' ? 'bg-[#5516ea] text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Регистрация
          </button>
          <button
            onClick={() => {
              triggerHaptic('select');
              setAuthView('forgot');
              setActiveChat(null);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              authView === 'forgot' ? 'bg-[#5516ea] text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Сброс пароля
          </button>
          <button
            onClick={() => {
              triggerHaptic('select');
              setAuthView(null);
              setActiveTab('tasks');
              setTaskSubView('tasks');
              setActiveChat(null);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              !authView && activeTab === 'tasks' && taskSubView === 'tasks' && !activeChat
                ? 'bg-[#5516ea] text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Задания
          </button>
          <button
            onClick={() => {
              triggerHaptic('select');
              setAuthView(null);
              setActiveTab('tasks');
              setTaskSubView('feed');
              setActiveChat(null);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              !authView && activeTab === 'tasks' && taskSubView === 'feed' && !activeChat
                ? 'bg-[#5516ea] text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Лента постов
          </button>
          <button
            onClick={() => {
              triggerHaptic('select');
              setAuthView(null);
              setActiveTab('messages');
              setActiveChat(null);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              !authView && activeTab === 'messages' && !activeChat
                ? 'bg-[#5516ea] text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Сообщения
          </button>
          <button
            onClick={() => {
              triggerHaptic('select');
              setAuthView(null);
              setActiveTab('messages');
              setActiveChat(conversations[0] || null);
            }}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
              !authView && activeChat
                ? 'bg-[#5516ea] text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Чат
          </button>
        </div>

        <button
          onClick={() => {
            triggerHaptic('select');
            setIsPhoneFrame(!isPhoneFrame);
          }}
          className="hidden md:flex items-center gap-1 bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded-lg text-stone-300 cursor-pointer"
          title="Переключить рамку смартфона"
        >
          {isPhoneFrame ? <Monitor size={14} /> : <Smartphone size={14} />}
          <span>{isPhoneFrame ? 'На весь экран' : 'Рамка iPhone'}</span>
        </button>
      </header>

      {/* Оболочка контейнера */}
      <main
        className={`w-full transition-all duration-300 overflow-hidden ${
          isPhoneFrame
            ? 'max-w-[400px] h-[840px] rounded-[44px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] border-[10px] border-stone-800 ring-1 ring-stone-700 relative'
            : 'max-w-2xl h-[92vh] rounded-2xl shadow-2xl relative'
        }`}
      >
        {authView !== null ? renderAuthScreens() : renderMainApp()}
      </main>
    </div>
  );
}