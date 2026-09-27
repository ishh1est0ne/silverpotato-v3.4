'use client';

import React, { useState } from 'react';
import { X, Sparkles, PlusCircle } from 'lucide-react';
import { PillButton } from '../ui/PillButton';
import { InputField } from '../ui/InputField';
import { TaskItem } from '@/lib/types';
import { api } from '@/lib/service/apiService';
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
  const [deadline, setDeadline] = useState('Выполнение до 30.09');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const newTask = await api.tasks.createTask(prompt.trim(), deadline.trim(), title.trim());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
        {/* Заголовок модального окна */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#5516ea]" />
            <h3 className="font-bold text-stone-900 text-base">
              Создать задание
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('select');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
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
            <label className="text-xs font-mono font-medium text-stone-600 px-1">
              Что нужно сделать? (Челлендж)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: Сфотографируй закат над городом"
              rows={3}
              className="w-full bg-[#f1f1f5] text-stone-800 placeholder-stone-400 font-sans text-sm p-3.5 rounded-2xl border border-stone-200/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#5b25e8] focus:ring-2 focus:ring-[#5b25e8]/20 transition-all resize-none"
              required
            />
          </div>

          <InputField
            label="Срок выполнения"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="Выполнение до 30.09"
          />

          {error && (
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-mono text-center">
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
