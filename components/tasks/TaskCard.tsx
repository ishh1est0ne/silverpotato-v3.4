'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem } from '@/lib/types';
import { Badge } from '../ui/Badge';
import { ImageIcon, Clock } from 'lucide-react';

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
    isUrgent: diff < 30 * 60 * 1000,
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

  return (
    <div
      onClick={() => onOpenTaskModal(task)}
      className="w-full bg-white rounded-3xl p-5 shadow-lg border border-purple-100 flex flex-col gap-3 transition-transform active:scale-[0.99] cursor-pointer hover:shadow-xl"
    >
      {/* Верхняя строка: Заголовок + Дата + Кнопка КОММ */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-lg leading-tight">
              {task.title}
            </h3>
            {task.expiresAt && !task.isCompleted && timer && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                  timer.isExpired
                    ? 'bg-rose-100 text-rose-700'
                    : timer.isUrgent
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-purple-100 text-[#5516ea]'
                }`}
              >
                <Clock size={11} />
                {timer.isExpired ? 'Истекло' : timer.text}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            {task.dateText}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments(task);
          }}
          className="border border-[#c6baf9] text-[#5516ea] hover:bg-[#ded7fc]/50 text-xs font-mono font-medium px-3 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          КОММ
          {task.commentCount > 0 && (
            <span className="w-4 h-4 bg-[#5516ea] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {task.commentCount}
            </span>
          )}
        </button>
      </div>

      {/* Бейдж: Автор */}
      <div>
        <Badge label={task.authorName} variant="lightPurple" />
      </div>

      {/* Текст задания (Промпт) */}
      <div className="text-sm font-sans text-stone-800 font-medium py-1">
        {task.prompt}
      </div>

      {/* Превью выполненного фото (если есть) */}
      {task.isCompleted && task.completedPhotoUrl && (
        <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.completedPhotoUrl}
            alt="Выполнение задания"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
            <ImageIcon size={12} />
            Фото-отчет
          </div>
        </div>
      )}

      {/* Футер: Статус и Дедлайн / Таймер */}
      <div className="flex items-center justify-between text-xs font-mono text-stone-500 pt-2 border-t border-stone-100">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              task.isCompleted
                ? 'bg-emerald-500 ring-2 ring-emerald-200'
                : timer?.isExpired
                ? 'bg-rose-500'
                : 'bg-amber-400'
            }`}
          />
          <span
            className={
              task.isCompleted
                ? 'text-emerald-700 font-medium'
                : timer?.isExpired
                ? 'text-rose-600 font-medium'
                : 'text-stone-600'
            }
          >
            {task.isCompleted ? 'Выполнено' : timer?.isExpired ? 'Срок истек' : 'В процессе'}
          </span>
        </div>

        <div className="text-stone-400 flex items-center gap-1">
          {task.expiresAt && timer && !task.isCompleted ? (
            <span className={timer.isUrgent ? 'text-amber-700 font-bold' : ''}>
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
