'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem, TaskComment } from '@/lib/types';
import { X, Send, MessageSquare } from 'lucide-react';
import { api } from '@/lib/service/apiService';

export interface CommentsModalProps {
  task: TaskItem;
  onClose: () => void;
  onCommentsUpdated: (taskId?: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  task,
  onClose,
  onCommentsUpdated,
}) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newText, setNewText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.tasks.getComments(task.id).then(setComments);
  }, [task.id]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsLoading(true);
    try {
      const curUser = await api.auth.getCurrentUser();
      const authorName = curUser?.name || 'Пользователь';
      const added = await api.tasks.addComment(task.id, authorName, newText.trim());
      setComments((prev) => [...prev, added]);
      setNewText('');
      onCommentsUpdated(task.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-[#141418] rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-white/10 flex flex-col gap-3 max-h-[85vh] animate-pop-in">
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[#5516ea] dark:text-purple-400" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Комментарии к заданию
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 cursor-pointer transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Список комментариев */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 py-2 max-h-64 pr-1">
          {comments.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 text-xs font-mono py-8">
              Пока нет комментариев. Будьте первым!
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="bg-stone-50 dark:bg-[#1a1a24] rounded-2xl p-3 border border-stone-100 dark:border-white/5 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#5516ea] dark:text-purple-400">
                    {c.authorName}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                    {c.createdAt}
                  </span>
                </div>
                <p className="text-xs font-sans text-stone-700 dark:text-stone-200 leading-relaxed">
                  {c.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Форма добавления комментария */}
        <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-white/10">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Написать комментарий..."
            className="flex-1 bg-stone-100 dark:bg-[#1a1a24] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-full px-4 py-2.5 text-xs font-sans border border-transparent dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#5516ea]/30 transition"
          />
          <button
            type="submit"
            disabled={!newText.trim() || isLoading}
            className="w-8 h-8 rounded-full bg-[#5516ea] text-white flex items-center justify-center hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
