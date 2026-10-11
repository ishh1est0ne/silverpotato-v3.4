'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquarePlus, User, Users, AtSign, Search, ArrowRight } from 'lucide-react';
import { ConversationItem, UserSummary } from '@/lib/types';
import { api } from '@/lib/service/apiService';
import { triggerHaptic } from '@/lib/native';

export interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (conv: ConversationItem) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  onClose,
  onChatCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [users, cur] = await Promise.all([
          api.chat.getUsers(searchQuery),
          api.auth.getCurrentUser(),
        ]);
        if (!isMounted) return;
        const filtered = users.filter((u) => u.id !== cur?.id && u.username !== cur?.username);
        setUsersList(filtered);
      } catch {
        // ignore
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  const handleStartChat = async (targetId?: string, targetName?: string, targetUsername?: string) => {
    const rawSearch = searchQuery.trim().replace(/^@+/, '');
    const finalUsername = targetUsername || (rawSearch ? rawSearch : undefined);
    const finalName = targetName || (finalUsername ? `@${finalUsername}` : 'Друг');

    if (!targetId && !finalUsername) {
      setError('Укажите @юзернейм или выберите пользователя из списка');
      triggerHaptic('warning');
      return;
    }

    setIsLoading(true);
    triggerHaptic('light');

    try {
      const newConv = await api.chat.createConversation(targetId, finalName, finalUsername);
      await triggerHaptic('success');
      onChatCreated(newConv);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось начать чат';
      setError(message);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanQuery = searchQuery.trim().toLowerCase().replace(/^@+/, '');
  const filteredUsers = usersList.filter((u) => {
    if (!cleanQuery) return true;
    const nameMatch = u.name.toLowerCase().includes(cleanQuery);
    const usernameMatch = u.username?.toLowerCase().includes(cleanQuery);
    return nameMatch || usernameMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-[#141418] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-white/10 flex flex-col gap-4 animate-pop-in">
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquarePlus size={20} className="text-[#5516ea] dark:text-purple-400" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Начать переписку
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('select');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 cursor-pointer transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Поиск по @юзернейму или имени */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#181822] px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10">
          <Search size={16} className="text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по @юзернейму или имени..."
            className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 font-mono text-xs focus:outline-none"
            autoFocus
          />
        </div>

        {/* Быстрое создание чата по введенному юзернейму (Requirement 5) */}
        {cleanQuery && !filteredUsers.some((u) => u.username?.toLowerCase() === cleanQuery) && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleStartChat(undefined, undefined, cleanQuery)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-left transition cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <AtSign size={16} className="text-[#5516ea] dark:text-purple-400" />
              <div>
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Написать по юзернейму
                </p>
                <p className="text-[11px] font-mono text-[#5516ea] dark:text-purple-300">
                  @{cleanQuery}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#5516ea] dark:text-purple-400" />
          </button>
        )}

        {/* Список зарегистрированных пользователей */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 font-medium flex items-center gap-1.5">
              <Users size={13} className="text-[#5516ea] dark:text-purple-400" />
              Доступные пользователи:
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              {filteredUsers.length}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-900/40 border border-slate-200/60 dark:border-white/5 text-center flex flex-col gap-1">
                <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Пользователи не найдены
                </p>
                <p className="text-[11px] text-stone-400">
                  Введите юзернейм собеседника выше, чтобы начать диалог.
                </p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleStartChat(u.id, u.name, u.username)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-purple-950/20 dark:hover:bg-purple-900/30 border border-slate-200 dark:border-white/10 text-left transition cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Аватар пользователя */}
                    <div className="w-9 h-9 rounded-full bg-[#5516ea] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-sm overflow-hidden">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-none flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-semibold">
                            admin
                          </span>
                        )}
                      </div>
                      {/* Юзернейм с собачкой */}
                      <div className="text-[10px] font-mono text-[#5516ea] dark:text-purple-400 font-semibold mt-0.5">
                        @{u.username || u.name.toLowerCase().replace(/[^a-z0-9_]/gi, '')}
                      </div>
                      <div className="text-[10px] font-mono mt-0.5 flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                          }`}
                        />
                        <span className={u.isOnline ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-stone-400 dark:text-stone-500'}>
                          {u.isOnline ? 'В сети' : u.lastSeenText ? `Был(а) ${u.lastSeenText}` : 'Не в сети'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#5516ea] dark:text-purple-300 font-semibold px-2 py-1 rounded-lg bg-purple-100/60 dark:bg-purple-900/40">
                    Написать
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {error && (
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-mono text-center border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
