'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ConversationItem, ChatMessage } from '@/lib/types';
import { ArrowLeft, Send } from 'lucide-react';
import { api, isCustomBackendConfigured } from '@/lib/service/apiService';
import { triggerHaptic, sendLocalPush } from '@/lib/native';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export interface ChatScreenProps {
  conversation: ConversationItem;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversation,
  onBack,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    api.chat.getMessages(conversation.id).then((msgs) => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });

    const unsubscribe = api.chat.subscribe(conversation.id, (newMsg) => {
      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      if (!newMsg.isOutgoing) {
        triggerHaptic('medium');
        sendLocalPush(conversation.friendName, newMsg.text);
      }
      setTimeout(scrollToBottom, 100);
    });

    return () => {
      unsubscribe();
    };
  }, [conversation.id, conversation.friendName]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    triggerHaptic('light');

    try {
      const newMsg = await api.chat.sendMessage(conversation.id, text);
      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      setTimeout(scrollToBottom, 100);

      // Только в локальном оффлайн-режиме (без сервера Proxmox и без Supabase) сымитируем ответ для теста
      if (!isSupabaseConfigured && !isCustomBackendConfigured) {
        setTimeout(async () => {
          const replies = [
            'Круто! Я тоже сейчас выполняю задание.',
            'Супер, уже посмотрел фото!',
            'Привет! Давай сделаем это быстрее всех.',
            'Договорились, сейчас скину свой отчет!',
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const now = new Date();
          const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const friendMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            chatId: conversation.id,
            senderId: conversation.friendId,
            senderName: conversation.friendName,
            text: randomReply,
            timeText,
            isOutgoing: false,
          };
          setMessages((prev) => [...prev, friendMsg]);
          await triggerHaptic('medium');
          await sendLocalPush(conversation.friendName, randomReply);
          setTimeout(scrollToBottom, 100);
        }, 1500);
      }
    } catch (err) {
      console.error('Ошибка отправки:', err);
      triggerHaptic('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Хедер чата в стиле Figma: светлая сиреневая плашка */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition cursor-pointer active:scale-95"
          title="Назад к сообщениям"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 bg-[#c6baf9] text-stone-900 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-md">
          {`Чат ${conversation.friendName}`}
        </div>
      </div>

      {/* Разделитель дат */}
      <div className="text-center py-2">
        <span className="text-white/80 font-mono text-xs">Сегодня</span>
      </div>

      {/* Список сообщений */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
        {messages.map((m) => {
          return (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.isOutgoing ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-full px-5 py-2.5 shadow-md flex items-center justify-between gap-4 font-mono text-sm ${
                  m.isOutgoing
                    ? 'bg-[#ded7fc] text-stone-900 border border-purple-200'
                    : 'bg-white text-stone-900 border border-stone-100'
                }`}
              >
                <span>{m.text}</span>
                <span className="text-[11px] text-stone-500 font-sans ml-2 self-end">
                  {m.timeText}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Панель ввода сообщения */}
      <div className="p-3 bg-white/10 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-white text-stone-900 placeholder-stone-400 font-mono text-sm py-3 px-5 rounded-full shadow-inner border border-stone-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-12 h-12 rounded-full bg-white text-[#5516ea] hover:bg-stone-100 shadow-md flex items-center justify-center transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
