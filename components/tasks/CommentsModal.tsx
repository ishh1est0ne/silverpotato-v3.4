'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem, TaskComment } from '@/lib/types';
import { X, Send, MessageSquare } from 'lucide-react';
import { api } from '@/lib/service/apiService';

export interface CommentsModalProps {
  task: TaskItem;
  onClose: () => void;
  onCommentsUpdated: () => void;
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
      const added = await api.tasks.addComment(task.id, 'Я', newText.trim());
      setComments((prev) => [...prev, added]);
      setNewText('');
      onCommentsUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-3 max-h-[85vh]">
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[#5516ea]" />
            <h3 className="font-bold text-stone-900 text-base">
              Комментарии к заданию
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Список комментариев */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 py-2 max-h-64 pr-1">
          {comments.length === 0 ? (
            <p className="text-center text-stone-400 text-xs font-mono py-8">
              Пока нет комментариев. Будьте первым!
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="bg-stone-50 rounded-2xl p-3 border border-stone-100 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#5516ea]">
                    {c.authorName}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">
                    {c.createdAt}
                  </span>
                </div>
                <p className="text-xs font-sans text-stone-700 leading-relaxed">
                  {c.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Форма добавления комментария */}
        <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Написать комментарий..."
            className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#5516ea]/30"
          />
          <button
            type="submit"
            disabled={!newText.trim() || isLoading}
            className="w-8 h-8 rounded-full bg-[#5516ea] text-white flex items-center justify-center hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
