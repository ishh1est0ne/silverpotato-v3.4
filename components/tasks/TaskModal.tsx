'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem } from '@/lib/types';
import { X, Camera, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { PillButton } from '../ui/PillButton';
import { Badge } from '../ui/Badge';
import { api } from '@/lib/service/apiService';
import { triggerHaptic, sendLocalPush } from '@/lib/native';

export interface TaskModalProps {
  task: TaskItem;
  onClose: () => void;
  onTaskUpdated: (updatedTask: TaskItem) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  onTaskUpdated,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(task.completedPhotoUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Обработка загрузки или съемки фото с камеры устройства/Capacitor
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Хедер модалки */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-lg">{task.title}</h3>
            <Badge label={task.authorName} variant="lightPurple" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Описание и требования */}
        <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100">
          <span className="text-[11px] font-mono text-[#5516ea] uppercase tracking-wider font-semibold">
            Цель задания:
          </span>
          <p className="text-base font-medium text-stone-800 mt-1">
            {task.prompt}
          </p>
          <div className="flex items-center gap-3 text-xs font-mono text-stone-500 mt-3 pt-2 border-t border-purple-200/50 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {task.dateText}
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <Clock size={13} /> {timerText ? `Осталось: ${timerText}` : task.deadlineText}
            </span>
          </div>
        </div>

        {/* Статус и загрузка фото */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono text-stone-600 font-medium">
            Фото-подтверждение:
          </span>

          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-purple-200 bg-stone-100 max-h-56">
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
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <label className="border-2 border-dashed border-[#5516ea]/40 hover:border-[#5516ea] bg-purple-50/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition">
              <div className="w-12 h-12 rounded-full bg-[#5516ea]/10 text-[#5516ea] flex items-center justify-center">
                <Camera size={24} />
              </div>
              <span className="text-xs font-mono font-medium text-[#5516ea]">
                Сделать фото или выбрать из галереи
              </span>
              <span className="text-[10px] text-stone-400">
                (Поддерживается в браузере и на смартфоне)
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Кнопка отправки */}
        <div className="pt-2">
          {task.isCompleted ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-mono text-xs font-medium border border-emerald-200">
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
        </div>
      </div>
    </div>
  );
};
