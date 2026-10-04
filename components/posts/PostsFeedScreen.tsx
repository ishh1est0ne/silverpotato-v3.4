'use client';

import React, { useState, useEffect } from 'react';
import { TaskItem, TaskComment, User } from '@/lib/types';
import { api } from '@/lib/service/apiService';
import { triggerHaptic } from '@/lib/native';
import { Heart, MessageSquare, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface PostsFeedScreenProps {
  tasks: TaskItem[];
  currentUser?: User | null;
  onOpenCreateTask?: () => void;
  onCommentsUpdated?: (taskId?: string) => void;
}

export const PostsFeedScreen: React.FC<PostsFeedScreenProps> = ({
  tasks,
  currentUser: initialUser,
  onOpenCreateTask,
  onCommentsUpdated,
}) => {
  // Фильтруем посты, где есть фото-отчет
  const completedPosts = tasks.filter((t) => t.isCompleted && t.completedPhotoUrl);

  // Локальные лайки для интерактивности
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({
    'task-2': { count: 5, liked: false },
    'task-feed-1': { count: 8, liked: true },
    'task-feed-2': { count: 3, liked: false },
  });

  // Комментарии по каждому посту
  const [commentsMap, setCommentsMap] = useState<Record<string, TaskComment[]>>({});
  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [isSubmittingMap, setIsSubmittingMap] = useState<Record<string, boolean>>({});

  // Загружаем комментарии для всех отображаемых постов
  useEffect(() => {
    completedPosts.forEach((post) => {
      api.tasks.getComments(post.id).then((comments) => {
        setCommentsMap((prev) => ({ ...prev, [post.id]: comments }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedPosts.length]);

  const handleToggleLike = (postId: string) => {
    triggerHaptic('light');
    setLikes((prev) => {
      const current = prev[postId] || { count: 0, liked: false };
      const nextLiked = !current.liked;
      const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);
      return {
        ...prev,
        [postId]: { count: nextCount, liked: nextLiked },
      };
    });
  };

  const handleSendComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (inputMap[postId] || '').trim();
    if (!text) return;

    triggerHaptic('select');
    setIsSubmittingMap((prev) => ({ ...prev, [postId]: true }));

    try {
      const user = initialUser || (await api.auth.getCurrentUser());
      const authorName = user?.name || 'Пользователь';
      const added = await api.tasks.addComment(postId, authorName, text);

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), added],
      }));

      setInputMap((prev) => ({ ...prev, [postId]: '' }));
      if (onCommentsUpdated) {
        onCommentsUpdated(postId);
      }
    } catch (err) {
      console.error('Ошибка отправки комментария:', err);
    } finally {
      setIsSubmittingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2 select-none">
      {/* Баннер заголовка ленты */}
      <div className="bg-[#c6baf9] text-stone-900 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-md flex items-center justify-center gap-2">
        <span>📸 Лента выполненных заданий</span>
        <span className="bg-[#5516ea] text-white text-xs px-2 py-0.5 rounded-full font-sans">
          {completedPosts.length}
        </span>
      </div>

      {completedPosts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center flex flex-col items-center gap-3 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-[#5516ea] flex items-center justify-center">
            <Sparkles size={32} />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Пока нет выполненных постов</h3>
          <p className="text-xs font-sans text-stone-500 max-w-xs">
            Выполните любое фото-задание из вкладки «Задания» или загрузите свое фото, чтобы оно появилось в общей ленте!
          </p>
          {onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#5516ea] text-white font-mono text-xs font-medium shadow hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Создать задание
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {completedPosts.map((post) => {
            const postLikes = likes[post.id] || { count: 0, liked: false };
            const postComments = commentsMap[post.id] || [];
            const inputText = inputMap[post.id] || '';
            const isSubmitting = isSubmittingMap[post.id] || false;

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-4 shadow-xl border border-purple-100 flex flex-col gap-3 transition hover:shadow-2xl"
              >
                {/* Хедер поста: Автор, Дата, Бейдж статуса */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#5516ea] to-[#8d61f7] text-white flex items-center justify-center text-sm font-bold font-mono shadow-sm">
                      {post.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm leading-tight">
                          {post.authorName}
                        </span>
                        <Badge label="Автор" variant="lightPurple" />
                      </div>
                      <span className="text-[11px] font-sans text-stone-400">
                        {post.completedAt || post.dateText}
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                    <CheckCircle2 size={12} />
                    Выполнено
                  </span>
                </div>

                {/* Промпт / Челлендж */}
                <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5516ea] font-semibold">
                    Задание:
                  </span>
                  <p className="text-xs font-sans font-medium text-stone-800 mt-0.5">
                    {post.prompt}
                  </p>
                </div>

                {/* Фотография выполненного задания */}
                {post.completedPhotoUrl && (
                  <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.completedPhotoUrl}
                      alt={post.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Панель действий: Лайк и счетчик комментов */}
                <div className="flex items-center justify-between px-1 pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className="flex items-center gap-1.5 text-xs font-mono transition cursor-pointer active:scale-90"
                    >
                      <Heart
                        size={18}
                        className={
                          postLikes.liked
                            ? 'fill-rose-500 text-rose-500 animate-pulse'
                            : 'text-stone-400 hover:text-stone-600'
                        }
                      />
                      <span className={postLikes.liked ? 'text-rose-600 font-bold' : 'text-stone-500'}>
                        {postLikes.count}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-stone-500">
                      <MessageSquare size={17} className="text-[#5516ea]" />
                      <span>{postComments.length}</span>
                    </div>
                  </div>
                </div>

                {/* Список комментариев к посту */}
                <div className="flex flex-col gap-2 pt-1 border-t border-stone-100">
                  <span className="text-[11px] font-mono font-semibold text-stone-600">
                    Комментарии ({postComments.length}):
                  </span>

                  {postComments.length === 0 ? (
                    <p className="text-[11px] font-sans text-stone-400 py-1 italic">
                      Пока нет комментариев. Напишите первым!
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {postComments.map((c) => (
                        <div
                          key={c.id}
                          className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 flex flex-col gap-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[#5516ea]">
                              {c.authorName}
                            </span>
                            <span className="font-mono text-[10px] text-stone-400">
                              {c.createdAt}
                            </span>
                          </div>
                          <p className="text-xs font-sans text-stone-800 leading-relaxed">
                            {c.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Быстрый ввод комментария прямо под постом */}
                  <form onSubmit={(e) => handleSendComment(post.id, e)} className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputMap((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Написать комментарий..."
                      className="flex-1 bg-stone-100 text-stone-900 placeholder-stone-400 font-sans text-xs py-2 px-3.5 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#5516ea]/30 transition"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSubmitting}
                      className="w-8 h-8 rounded-full bg-[#5516ea] text-white hover:brightness-110 active:scale-95 flex items-center justify-center transition disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
