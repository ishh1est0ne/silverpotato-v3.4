'use client';

import React from 'react';
import { TaskItem } from '@/lib/types';
import { Badge } from '../ui/Badge';
import { ImageIcon } from 'lucide-react';

export interface TaskCardProps {
  task: TaskItem;
  onOpenTaskModal: (task: TaskItem) => void;
  onOpenComments: (task: TaskItem) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpenTaskModal,
  onOpenComments,
}) => {
  return (
    <div
      onClick={() => onOpenTaskModal(task)}
      className="w-full bg-white rounded-3xl p-5 shadow-lg border border-purple-100 flex flex-col gap-3 transition-transform active:scale-[0.99] cursor-pointer hover:shadow-xl"
    >
      {/* Верхняя строка: Заголовок + Дата + Кнопка КОММ */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-stone-900 text-lg leading-tight">
            {task.title}
          </h3>
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

      {/* Футер: Статус и Дедлайн */}
      <div className="flex items-center justify-between text-xs font-mono text-stone-500 pt-2 border-t border-stone-100">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              task.isCompleted ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-rose-400'
            }`}
          />
          <span className={task.isCompleted ? 'text-emerald-700 font-medium' : 'text-stone-600'}>
            {task.isCompleted ? 'Выполнено' : 'Не выполнено'}
          </span>
        </div>

        <div className="text-stone-400">
          • {task.deadlineText}
        </div>
      </div>
    </div>
  );
};
