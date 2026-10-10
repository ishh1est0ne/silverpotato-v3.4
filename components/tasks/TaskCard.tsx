'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem } from '@/lib/types';
import { Badge } from '../ui/Badge';
import { ImageIcon, Clock, AlertTriangle } from 'lucide-react';

export interface TaskCardProps {
  task: TaskItem;
  onOpenTaskModal: (task: TaskItem) => void;
  onOpenComments: (task: TaskItem) => void;
}

function getTimerInfo(expiresAt?: string) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) {
    return { text: 'Время вышло', isExpired: true, isUrgent: false };
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeFormatted = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return {
    text: timeFormatted,
    isExpired: false,
    isUrgent: diff < 3 * 60 * 1000, // Меньше 3 минут — срочно
  };
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpenTaskModal,
  onOpenComments,
}) => {
  const [timer, setTimer] = useState(() => getTimerInfo(task.expiresAt));

  useEffect(() => {
    if (!task.expiresAt || task.isCompleted) return;
    const interval = setInterval(() => {
      setTimer(getTimerInfo(task.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [task.expiresAt, task.isCompleted]);

  const isFailed = task.isFailed || (timer?.isExpired && !task.isCompleted);

  return (
    <div
      onClick={() => onOpenTaskModal(task)}
      className="w-full bg-white dark:bg-[#141418] rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col gap-3 transition-all duration-200 active:scale-[0.99] cursor-pointer hover:shadow-md animate-fade-in"
    >
      {/* Верхняя строка: Заголовок + Дата + Кнопка КОММ */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight">
              {task.title}
            </h3>
            {task.expiresAt && !task.isCompleted && timer && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                  isFailed
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                    : timer.isUrgent
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 animate-pulse'
                    : 'bg-purple-100 dark:bg-purple-950/80 text-[#5516ea] dark:text-purple-300'
                }`}
              >
                <Clock size={11} />
                {isFailed ? 'Дедлайн истек' : timer.text}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-sans mt-0.5">
            {task.dateText}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments(task);
          }}
          className="border border-[#c6baf9] dark:border-purple-800 text-[#5516ea] dark:text-purple-400 hover:bg-[#ded7fc]/50 dark:hover:bg-purple-900/30 text-xs font-mono font-medium px-3 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          КОММ
          {task.commentCount > 0 && (
            <span className="w-4 h-4 bg-[#5516ea] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {task.commentCount}
            </span>
          )}
        </button>
      </div>

      {/* Бейдж: Автор и тип */}
      <div className="flex items-center gap-1.5">
        <Badge label={task.authorName} variant="lightPurple" />
        {task.sourceType === 'self' && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
            Досрочное
          </span>
        )}
      </div>

      {/* Текст задания (Промпт) */}
      <div className="text-sm font-sans text-stone-800 dark:text-stone-200 font-medium py-1">
        {task.prompt}
      </div>

      {/* Оповещение о штрафе за просрочку */}
      {isFailed && !task.isCompleted && (
        <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-mono font-medium">
          <AlertTriangle size={15} className="shrink-0" />
          <span>Дедлайн провален! {task.penalty || 'Штраф: -50 очков'}</span>
        </div>
      )}

      {/* Превью выполненного фото (если есть) */}
      {task.isCompleted && task.completedPhotoUrl && (
        <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.completedPhotoUrl}
            alt="Выполнение задания"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
            <ImageIcon size={12} />
            Фото-отчет
          </div>
        </div>
      )}

      {/* Футер: Статус и Дедлайн / Таймер */}
      <div className="flex items-center justify-between text-xs font-mono text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-white/10">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              task.isCompleted
                ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900'
                : isFailed
                ? 'bg-rose-500'
                : 'bg-amber-400'
            }`}
          />
          <span
            className={
              task.isCompleted
                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                : isFailed
                ? 'text-rose-600 dark:text-rose-400 font-medium'
                : 'text-stone-600 dark:text-stone-300'
            }
          >
            {task.isCompleted ? 'Выполнено' : isFailed ? 'Провалено' : 'В процессе'}
          </span>
        </div>

        <div className="text-stone-400 dark:text-stone-500 flex items-center gap-1">
          {task.expiresAt && timer && !task.isCompleted ? (
            <span className={timer.isUrgent ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
              • Осталось: {timer.text}
            </span>
          ) : (
            <span>• {task.deadlineText}</span>
          )}
        </div>
      </div>
    </div>
  );
};
