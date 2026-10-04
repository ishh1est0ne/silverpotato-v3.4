'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquarePlus, User, Users } from 'lucide-react';
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
        const filtered = users.filter((u) => u.id !== cur?.id && u.email !== cur?.email);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquarePlus size={20} className="text-[#5516ea]" />
            <h3 className="font-bold text-stone-900 text-base">
              Начать переписку
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('select');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Список зарегистрированных пользователей */}
        {usersList.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono text-stone-500 font-medium flex items-center gap-1">
              <Users size={13} className="text-[#5516ea]" /> Пользователи онлайн / в сети:
            </span>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {usersList.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleStartChat(u.id, u.name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100 border border-purple-200/60 text-left transition cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#5516ea] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900 leading-none">{u.name}</div>
                      <div className="text-[10px] font-mono text-stone-400 mt-0.5">{u.email}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#5516ea] font-semibold">Написать →</span>
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
          className="flex flex-col gap-3.5 pt-1 border-t border-stone-100"
        >
          <InputField
            label="Или введите имя вручную"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Например: Друг или Алексей"
            leftIcon={<User size={18} />}
          />

          {error && (
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-mono text-center">
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
