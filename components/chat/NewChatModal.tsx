'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquarePlus, User, Users, Circle } from 'lucide-react';
import { PillButton } from '../ui/PillButton';
import { InputField } from '../ui/InputField';
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
  const [friendName, setFriendName] = useState('');
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [users, cur] = await Promise.all([
          api.chat.getUsers(),
          api.auth.getCurrentUser(),
        ]);
        if (!isMounted) return;
        const filtered = users.filter((u) => u.id !== cur?.id && u.name !== cur?.name);
        setUsersList(filtered);
      } catch {
        // ignore
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartChat = async (targetId?: string, targetName?: string) => {
    const finalName = (targetName || friendName).trim();
    if (!finalName) {
      setError('Укажите имя друга или выберите пользователя из списка');
      triggerHaptic('warning');
      return;
    }

    setIsLoading(true);
    triggerHaptic('light');

    try {
      const newConv = await api.chat.createConversation(targetId, finalName);
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

        {/* Список зарегистрированных пользователей без почты для безопасности */}
        {usersList.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 font-medium flex items-center gap-1.5">
              <Users size={13} className="text-[#5516ea] dark:text-purple-400" />
              Пользователи сети:
            </span>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {usersList.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleStartChat(u.id, u.name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200/50 dark:border-purple-800/40 text-left transition cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#5516ea] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-sm">
                      {u.name.charAt(0).toUpperCase()}
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
                      <div className="text-[10px] font-mono mt-1 flex items-center gap-1">
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
                  <span className="text-[11px] font-mono text-[#5516ea] dark:text-purple-300 font-semibold">
                    Написать →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartChat(undefined, friendName);
          }}
          className="flex flex-col gap-3.5 pt-1 border-t border-stone-100 dark:border-white/10"
        >
          <InputField
            label="Или введите имя друга вручную"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Например: Алексей или Друг"
            leftIcon={<User size={18} />}
          />

          {error && (
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-mono text-center border border-rose-200 dark:border-rose-900/40">
              {error}
            </div>
          )}

          <div className="pt-1">
            <PillButton type="submit" isLoading={isLoading} className="w-full">
              Открыть чат
            </PillButton>
          </div>
        </form>
      </div>
    </div>
  );
};
