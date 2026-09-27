'use client';

import React, { useState } from 'react';
import { X, MessageSquarePlus, User } from 'lucide-react';
import { PillButton } from '../ui/PillButton';
import { InputField } from '../ui/InputField';
import { ConversationItem } from '@/lib/types';
import { api } from '@/lib/service/apiService';
import { triggerHaptic } from '@/lib/native';

export interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (conv: ConversationItem) => void;
}

const SUGGESTED_FRIENDS = ['Друг 2', 'Друг 3', 'Друг 7', 'Алексей', 'Мария'];

export const NewChatModal: React.FC<NewChatModalProps> = ({
  onClose,
  onChatCreated,
}) => {
  const [friendName, setFriendName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartChat = async (nameToUse: string) => {
    const trimmed = nameToUse.trim();
    if (!trimmed) {
      setError('Укажите имя друга');
      triggerHaptic('warning');
      return;
    }

    setIsLoading(true);
    triggerHaptic('light');

    try {
      const newConv = await api.chat.createConversation(trimmed);
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartChat(friendName);
          }}
          className="flex flex-col gap-3.5"
        >
          <InputField
            label="Имя собеседника"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Например: Друг 2 или Alex"
            leftIcon={<User size={18} />}
            required
          />

          {/* Быстрый выбор друзей */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-stone-400">
              Быстрый выбор:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_FRIENDS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    triggerHaptic('select');
                    setFriendName(name);
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-mono bg-purple-50 text-[#5516ea] hover:bg-purple-100 border border-purple-200/50 cursor-pointer transition active:scale-95"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-mono text-center">
              {error}
            </div>
          )}

          <div className="pt-2">
            <PillButton type="submit" isLoading={isLoading} className="w-full">
              Открыть чат
            </PillButton>
          </div>
        </form>
      </div>
    </div>
  );
};
