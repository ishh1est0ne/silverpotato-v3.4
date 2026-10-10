'use client';

import React, { useState } from 'react';
import { X, Sparkles, PlusCircle, Dices } from 'lucide-react';
import { PillButton } from '../ui/PillButton';
import { InputField } from '../ui/InputField';
import { TaskItem } from '@/lib/types';
import { api, PHOTO_CHALLENGES_BANK } from '@/lib/service/apiService';
import { triggerHaptic, sendLocalPush } from '@/lib/native';

export interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: (task: TaskItem) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('Задание');
  const [prompt, setPrompt] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [deadline, setDeadline] = useState('Дедлайн 10 минут');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRandomPrompt = () => {
    triggerHaptic('select');
    const random = PHOTO_CHALLENGES_BANK[Math.floor(Math.random() * PHOTO_CHALLENGES_BANK.length)];
    setPrompt(random);
  };

  const handleSelectDuration = (hours: number) => {
    triggerHaptic('select');
    setDurationHours(hours);
    const hourWord = hours === 1 ? '1 час' : hours < 5 ? `${hours} часа` : `${hours} часов`;
    setDeadline(`Осталось ${hourWord}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('light');

    if (!prompt.trim()) {
      setError('Опишите, что нужно сделать');
      triggerHaptic('warning');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newTask = await api.tasks.createTask(
        prompt.trim(),
        deadline.trim(),
        title.trim(),
        'Я',
        durationHours
      );
      await triggerHaptic('success');
      await sendLocalPush('Задание опубликовано', `Новое задание: "${prompt}"`);
      onTaskCreated(newTask);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось создать задание';
      setError(message);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-[#141418] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-white/10 flex flex-col gap-4 animate-pop-in">
        {/* Заголовок модального окна */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#5516ea] dark:text-purple-400" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Создать задание
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('select');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 cursor-pointer transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <InputField
            label="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Задание"
            required
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-mono font-medium text-stone-600 dark:text-stone-400">
                Что нужно сделать? (Челлендж)
              </label>
              <button
                type="button"
                onClick={handleRandomPrompt}
                className="text-[11px] font-mono text-[#5516ea] dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Dices size={13} />
                Случайная идея
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: Сфотографируй воду или необычную тень"
              rows={3}
              className="w-full bg-[#f1f1f5] dark:bg-[#1a1a24] text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 font-sans text-sm p-3.5 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#5b25e8] focus:ring-2 focus:ring-[#5b25e8]/20 transition-all resize-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-medium text-stone-600 dark:text-stone-400 px-1">
              Таймер выполнения (часов)
            </label>
            <div className="flex gap-2">
              {[1, 3, 6, 24].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelectDuration(h)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer border ${
                    durationHours === h
                      ? 'bg-[#5516ea] text-white border-[#5516ea]'
                      : 'bg-[#f1f1f5] dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border-transparent dark:border-white/10'
                  }`}
                >
                  {h === 1 ? '1 ч' : `${h} ч`}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-mono text-center border border-rose-200 dark:border-rose-900/40">
              {error}
            </div>
          )}

          <div className="pt-2">
            <PillButton type="submit" isLoading={isLoading} className="w-full">
              <PlusCircle size={16} />
              Опубликовать задание
            </PillButton>
          </div>
        </form>
      </div>
    </div>
  );
};
