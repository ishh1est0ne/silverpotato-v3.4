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
      className="w-full bg-white rounded-3xl p-5 shadow-lg border border-purple-100 flex flex-col gap-3 transition-transform active:scale-[0.99] cursor-pointer hover:shadow-xl"
    >
      {/* Верх: Имя Друга + Дата */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-stone-900 text-lg leading-tight">
            {conversation.friendName}
          </h3>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            {conversation.dateText}
          </p>
        </div>

        {/* Время сообщения */}
        <div>
          <Badge label={conversation.timeText} variant="lightPurple" />
        </div>
      </div>

      {/* Превью последнего сообщения */}
      <div className="text-sm font-sans text-stone-800 font-medium py-1">
        {conversation.lastMessage}
      </div>

      {/* Кнопка-ссылка Открыть чат */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
        <button
          type="button"
          className="text-xs font-mono font-medium text-[#5516ea] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#5516ea]" />
          Открыть чат
        </button>

        {conversation.unread && (
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        )}
      </div>
    </div>
  );
};
