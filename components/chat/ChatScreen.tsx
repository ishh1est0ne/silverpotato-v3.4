'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ConversationItem, ChatMessage } from '@/lib/types';
import { ArrowLeft, Send, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
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
    // 1. Загрузка сообщений и пометка прочитанными
    api.chat.getMessages(conversation.id).then((msgs) => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
      api.chat.markConversationRead(conversation.id);
    });

    // 2. Подписка на сокеты: новые сообщения и статус прочитано
    const unsubscribe = api.chat.subscribe(
      conversation.id,
      (newMsg) => {
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
        if (!newMsg.isOutgoing) {
          triggerHaptic('medium');
          sendLocalPush(conversation.friendName, newMsg.text);
          // Сразу помечаем прочитанным, раз чат открыт
          api.chat.markConversationRead(conversation.id);
        }
        setTimeout(scrollToBottom, 100);
      },
      // Callback когда получатель прочитал наши сообщения
      () => {
        setMessages((prev) =>
          prev.map((m) => (m.isOutgoing ? { ...m, status: 'read' as const } : m))
        );
      }
    );

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

    // Оптимистичное добавление сообщения со статусом 'sending'
    const tempId = `temp-${Date.now()}`;
    const now = new Date();
    const timeText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('app_user') || 'null') : null;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      chatId: conversation.id,
      senderId: currentUser?.id || 'current-user',
      senderName: currentUser?.name || 'Я',
      text,
      timeText,
      status: 'sending',
      isOutgoing: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const realMsg = await api.chat.sendMessage(conversation.id, text);
      // Заменяем временное сообщение реальным
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...realMsg, status: realMsg.status || 'delivered' } : m))
      );
      setTimeout(scrollToBottom, 100);

      // Локальная имитация ответа только при полном оффлайне
      if (!isSupabaseConfigured && !isCustomBackendConfigured) {
        setTimeout(async () => {
          const replies = [
            'Круто! Я тоже сейчас выполняю задание.',
            'Супер, уже посмотрел фото!',
            'Привет! Давай сделаем это быстрее всех.',
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const replyTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const friendMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            chatId: conversation.id,
            senderId: conversation.friendId,
            senderName: conversation.friendName,
            text: randomReply,
            timeText: replyTime,
            status: 'delivered',
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
      // Помечаем сообщение как не доставлено
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' as const } : m))
      );
      triggerHaptic('error');
    } finally {
      setIsSending(false);
    }
  };

  const renderStatusIcon = (status?: 'sending' | 'delivered' | 'read') => {
    switch (status) {
      case 'read':
        return (
          <span title="Прочитано" className="text-[#5516ea] dark:text-purple-300 flex items-center gap-0.5 text-[9px] font-mono font-bold">
            <CheckCheck size={14} strokeWidth={2.5} />
            <span className="text-[9px]">Прочитано</span>
          </span>
        );
      case 'delivered':
        return (
          <span title="Доставлено" className="text-stone-400 dark:text-stone-400 flex items-center gap-0.5 text-[9px] font-mono">
            <Check size={13} strokeWidth={2.2} />
            <span className="text-[9px]">Доставлено</span>
          </span>
        );
      case 'sending':
      default:
        return (
          <span title="Отправляется / Не доставлено" className="text-amber-500 dark:text-amber-400 flex items-center gap-0.5 text-[9px] font-mono">
            <Clock size={12} className="animate-spin" />
            <span className="text-[9px]">Отправка</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none animate-in fade-in duration-200">
      {/* Хедер чата */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white text-stone-800 border border-slate-200 shadow-sm hover:bg-slate-100 dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/20 transition cursor-pointer active:scale-95 shrink-0 flex items-center justify-center"
          title="Назад к сообщениям"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 bg-white dark:bg-[#141418] text-stone-900 dark:text-stone-100 border border-slate-200 dark:border-white/10 font-mono py-2 px-3 rounded-2xl font-bold shadow-xs flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-[#5516ea] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-purple-200 dark:border-purple-800">
            {conversation.friendAvatarUrl ? (
              <img src={conversation.friendAvatarUrl} alt={conversation.friendName} className="w-full h-full object-cover" />
            ) : (
              conversation.friendName ? conversation.friendName.charAt(0).toUpperCase() : '?'
            )}
          </div>
          <div className="text-left truncate leading-tight">
            <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{conversation.friendName}</div>
            {conversation.friendUsername && (
              <div className="text-[10px] text-[#5516ea] dark:text-purple-400 font-semibold truncate">@{conversation.friendUsername.replace(/^@+/, '')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Разделитель дат */}
      <div className="text-center py-1.5">
        <span className="text-stone-500 dark:text-white/60 font-mono text-[11px] px-3 py-0.5 rounded-full bg-slate-200/80 dark:bg-black/40">
          Сегодня
        </span>
      </div>

      {/* Список сообщений */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2.5">
        {messages.map((m) => {
          return (
            <div
              key={m.id}
              className={`flex flex-col animate-fade-in ${
                m.isOutgoing ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-md flex items-end justify-between gap-3 font-mono text-sm ${
                  m.isOutgoing
                    ? 'bg-[#ded7fc] dark:bg-[#341b77] text-stone-900 dark:text-stone-100 border border-purple-200 dark:border-purple-600/30'
                    : 'bg-white dark:bg-[#181822] text-stone-900 dark:text-stone-100 border border-stone-100 dark:border-white/10'
                }`}
              >
                <span className="break-words leading-relaxed">{m.text}</span>
                <div className="flex items-center gap-1 shrink-0 self-end">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                    {m.timeText}
                  </span>
                  {m.isOutgoing && renderStatusIcon(m.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Панель ввода сообщения */}
      <div className="p-3 bg-white/95 dark:bg-[#141418]/95 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-white/10 shadow-lg">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-slate-100 dark:bg-[#181822] text-stone-900 dark:text-stone-100 placeholder-stone-400 font-mono text-sm py-3 px-5 rounded-full shadow-inner border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-12 h-12 rounded-full bg-[#5516ea] text-white hover:brightness-110 shadow-md flex items-center justify-center transition active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
