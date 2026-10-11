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
    'task-admin-initial': { count: 3, liked: false },
  });

  // Комментарии по каждому посту
  const [commentsMap, setCommentsMap] = useState<Record<string, TaskComment[]>>({});
  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [isSubmittingMap, setIsSubmittingMap] = useState<Record<string, boolean>>({});

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

    triggerHaptic('light');
    setIsSubmittingMap((prev) => ({ ...prev, [postId]: true }));

    try {
      const user = initialUser || (await api.auth.getCurrentUser());
      const authorName = user?.name || 'Я';

      const newComment = await api.tasks.addComment(postId, authorName, text);
      await triggerHaptic('success');

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setInputMap((prev) => ({ ...prev, [postId]: '' }));

      if (onCommentsUpdated) {
        onCommentsUpdated(postId);
      }
    } catch (err) {
      console.error('Ошибка отправки комментария:', err);
      triggerHaptic('error');
    } finally {
      setIsSubmittingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2 animate-in fade-in duration-200">
      {/* Баннер ленты */}
      <div className="bg-white text-stone-900 border border-slate-200 dark:bg-[#2e1d61] dark:text-stone-100 dark:border-purple-600/30 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-sm flex items-center justify-between">
        <span className="flex-1 text-center">Лента выполненных заданий</span>
      </div>

      {completedPosts.length === 0 ? (
        <div className="bg-white dark:bg-[#141418] rounded-3xl p-8 text-center text-stone-500 dark:text-stone-400 font-mono text-sm border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center gap-3 animate-pop-in">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950 text-[#5516ea] dark:text-purple-300 flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="font-bold text-stone-800 dark:text-stone-100 text-base">Лента пока пуста</p>
            <p className="text-xs text-stone-400 mt-1">
              Выполните любое фото-задание дня и подтвердите его снимком!
            </p>
          </div>
          {onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="mt-2 py-2 px-5 bg-[#5516ea] text-white rounded-full font-mono text-xs font-bold shadow hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Создать первое задание
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
                className="bg-white dark:bg-[#141418] rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col gap-3 transition hover:shadow-md animate-fade-in"
              >
                {/* Хедер поста: Автор, Дата, Бейдж статуса */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#5516ea] to-[#8d61f7] text-white flex items-center justify-center text-sm font-bold font-mono shadow-sm overflow-hidden shrink-0">
                      {post.authorAvatarUrl ? (
                        <img src={post.authorAvatarUrl} alt={post.authorName} className="w-full h-full object-cover" />
                      ) : (
                        post.authorName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-sm leading-tight">
                          {post.authorName}
                        </span>
                        {post.authorUsername && (
                          <span className="text-[10px] font-mono text-[#5516ea] dark:text-purple-400 font-semibold">
                            @{post.authorUsername.replace(/^@+/, '')}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-sans text-stone-400 dark:text-stone-500">
                        {post.completedAt || post.dateText}
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-2.5 py-0.5 rounded-full font-medium">
                    <CheckCircle2 size={12} />
                    Выполнено
                  </span>
                </div>

                {/* Промпт / Челлендж */}
                <div className="bg-purple-50/70 dark:bg-purple-950/30 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5516ea] dark:text-purple-400 font-semibold">
                    Задание:
                  </span>
                  <p className="text-xs font-sans font-medium text-stone-800 dark:text-stone-100 mt-0.5">
                    {post.prompt}
                  </p>
                </div>

                {/* Фотография выполненного задания */}
                {post.completedPhotoUrl && (
                  <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-white/10 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.completedPhotoUrl}
                      alt={post.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Панель действий: Лайк и счетчик комментов */}
                <div className="flex items-center justify-between px-1 pt-1 border-t border-stone-100 dark:border-white/10">
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
                            : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
                        }
                      />
                      <span className={postLikes.liked ? 'text-rose-600 font-bold' : 'text-stone-500'}>
                        {postLikes.count}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-stone-500 dark:text-stone-400">
                      <MessageSquare size={17} className="text-[#5516ea] dark:text-purple-400" />
                      <span>{postComments.length}</span>
                    </div>
                  </div>
                </div>

                {/* Список комментариев к посту */}
                <div className="flex flex-col gap-2 pt-1 border-t border-stone-100 dark:border-white/10">
                  <span className="text-[11px] font-mono font-semibold text-stone-600 dark:text-stone-400">
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
                          className="bg-stone-50 dark:bg-[#1a1a24] rounded-xl p-2.5 border border-stone-100 dark:border-white/5 flex flex-col gap-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[#5516ea] dark:text-purple-400">
                              {c.authorName}
                            </span>
                            <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                              {c.createdAt}
                            </span>
                          </div>
                          <p className="text-xs font-sans text-stone-800 dark:text-stone-200 leading-relaxed">
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
                      className="flex-1 bg-stone-100 dark:bg-[#1a1a24] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 font-sans text-xs py-2 px-3.5 rounded-full border border-stone-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#5516ea]/30 transition"
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
