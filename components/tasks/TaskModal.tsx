'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TaskItem, User } from '@/lib/types';
import { X, Camera, Image as GalleryIcon, CheckCircle2, Calendar, Clock, AlertTriangle, Zap } from 'lucide-react';
import { PillButton } from '../ui/PillButton';
import { Badge } from '../ui/Badge';
import { api } from '@/lib/service/apiService';
import { triggerHaptic, sendLocalPush } from '@/lib/native';

export interface TaskModalProps {
  task: TaskItem;
  currentUser?: User | null;
  onClose: () => void;
  onTaskUpdated: (updatedTask: TaskItem) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  currentUser,
  onClose,
  onTaskUpdated,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(task.completedPhotoUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminExpiring, setIsAdminExpiring] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [timerText, setTimerText] = useState<string | null>(() => {
    if (!task.expiresAt) return null;
    const diff = new Date(task.expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Время вышло';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  });

  useEffect(() => {
    if (!task.expiresAt || task.isCompleted) return;
    const interval = setInterval(() => {
      const diff = new Date(task.expiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimerText('Время вышло');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setTimerText(hours > 0 ? `${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [task.expiresAt, task.isCompleted]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async () => {
    if (!photoPreview) return;
    setIsSubmitting(true);
    triggerHaptic('light');
    try {
      const updated = await api.tasks.submitTaskProof(task.id, photoPreview);
      await triggerHaptic('success');
      await sendLocalPush('Задание выполнено!', `Вы успешно сдали отчет по заданию "${task.title}"`);
      onTaskUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Ошибка сдачи задания:', err);
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminExpire = async () => {
    setIsAdminExpiring(true);
    triggerHaptic('warning');
    try {
      await api.tasks.expireTaskNow(task.id);
      onTaskUpdated({
        ...task,
        isFailed: true,
        penalty: '-50 очков (штраф за дедлайн)',
      });
      triggerHaptic('error');
      onClose();
    } catch (err) {
      console.error('Ошибка админского завершения:', err);
    } finally {
      setIsAdminExpiring(false);
    }
  };

  const isFailed = task.isFailed || (timerText === 'Время вышло' && !task.isCompleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-[#141418] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-white/10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-pop-in">
        {/* Хедер модалки */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-lg">{task.title}</h3>
            <Badge label={task.authorName} variant="lightPurple" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 cursor-pointer transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Описание и требования */}
        <div className="bg-purple-50/70 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40">
          <span className="text-[11px] font-mono text-[#5516ea] dark:text-purple-300 uppercase tracking-wider font-semibold">
            Цель задания:
          </span>
          <p className="text-base font-medium text-stone-800 dark:text-stone-100 mt-1">
            {task.prompt}
          </p>
          <div className="flex items-center gap-3 text-xs font-mono text-stone-500 dark:text-stone-400 mt-3 pt-2 border-t border-purple-200/50 dark:border-purple-800/40 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {task.dateText}
            </span>
            <span className={`flex items-center gap-1 font-semibold ${isFailed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
              <Clock size={13} /> {timerText ? `Осталось: ${timerText}` : task.deadlineText}
            </span>
          </div>
        </div>

        {/* Плашка штрафа */}
        {isFailed && !task.isCompleted && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-mono">
            <AlertTriangle size={16} className="shrink-0" />
            <div>
              <p className="font-bold">Дедлайн просрочен!</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">Наказание: {task.penalty || '-50 очков в профиль'}</p>
            </div>
          </div>
        )}

        {/* Статус и загрузка фото */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-mono text-stone-600 dark:text-stone-300 font-medium">
            Фото-подтверждение:
          </span>

          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-800 bg-stone-100 dark:bg-stone-800 max-h-56">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Предпросмотр"
                className="w-full h-full object-cover max-h-56"
              />
              {!task.isCompleted && (
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full cursor-pointer transition active:scale-95"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {/* Кнопка 1: Сделать фото с камеры */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="border-2 border-dashed border-[#5516ea]/40 hover:border-[#5516ea] bg-purple-50/40 dark:bg-purple-950/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-[#5516ea]/10 dark:bg-[#5516ea]/20 text-[#5516ea] dark:text-purple-300 flex items-center justify-center">
                  <Camera size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-[#5516ea] dark:text-purple-300">
                  Камера
                </span>
                <span className="text-[10px] text-stone-400">Снимок</span>
              </button>

              {/* Кнопка 2: Выбрать из галереи */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="border-2 border-dashed border-[#5516ea]/40 hover:border-[#5516ea] bg-purple-50/40 dark:bg-purple-950/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-[#5516ea]/10 dark:bg-[#5516ea]/20 text-[#5516ea] dark:text-purple-300 flex items-center justify-center">
                  <GalleryIcon size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-[#5516ea] dark:text-purple-300">
                  Галерея
                </span>
                <span className="text-[10px] text-stone-400">Из памяти</span>
              </button>

              {/* Скрытый инпут камеры (capture="environment") */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {/* Скрытый инпут галереи (без capture) */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="pt-2 flex flex-col gap-2">
          {task.isCompleted ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-medium border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 size={16} />
              Задание успешно выполнено!
            </div>
          ) : (
            <PillButton
              onClick={handleSubmitProof}
              disabled={!photoPreview}
              isLoading={isSubmitting}
              className="w-full"
            >
              Подтвердить выполнение
            </PillButton>
          )}

          {/* Кнопка ускорения дедлайна для аккаунта администратора */}
          {currentUser?.role === 'admin' && !task.isCompleted && (
            <button
              type="button"
              disabled={isAdminExpiring}
              onClick={handleAdminExpire}
              className="w-full py-2.5 rounded-2xl border border-rose-300 dark:border-rose-900/70 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 hover:bg-rose-100 disabled:opacity-50"
            >
              <Zap size={14} />
              <span>{isAdminExpiring ? 'Завершение...' : 'Завершить дедлайн сейчас (Admin)'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
