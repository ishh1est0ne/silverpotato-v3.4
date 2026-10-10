'use client';

import React from 'react';
import { ConversationItem } from '@/lib/types';
import { Badge } from '../ui/Badge';

export interface ConversationCardProps {
  conversation: ConversationItem;
  onOpenChat: (conv: ConversationItem) => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onOpenChat,
}) => {
  return (
    <div
      onClick={() => onOpenChat(conversation)}
      className="w-full bg-white dark:bg-[#141418] rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col gap-3 transition-all duration-200 active:scale-[0.99] cursor-pointer hover:shadow-md animate-fade-in"
    >
      {/* Верх: Имя Друга + Дата */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight">
            {conversation.friendName}
          </h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-sans mt-0.5">
            {conversation.dateText}
          </p>
        </div>

        {/* Время сообщения */}
        <div>
          <Badge label={conversation.timeText} variant="lightPurple" />
        </div>
      </div>

      {/* Превью последнего сообщения */}
      <div className="text-sm font-sans text-stone-800 dark:text-stone-200 font-medium py-1 break-words">
        {conversation.lastMessage}
      </div>

      {/* Кнопка-ссылка Открыть чат */}
      <div className="pt-2 border-t border-stone-100 dark:border-white/10 flex items-center justify-between">
        <button
          type="button"
          className="text-xs font-mono font-medium text-[#5516ea] dark:text-purple-400 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#5516ea] dark:bg-purple-400" />
          Открыть диалог
        </button>

        {conversation.unread && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500 text-white rounded-full font-bold shadow-sm">
              {conversation.unreadCount && conversation.unreadCount > 1 ? conversation.unreadCount : 'Новое'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
