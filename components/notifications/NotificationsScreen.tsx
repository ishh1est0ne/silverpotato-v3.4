'use client';

import React, { useState, useEffect } from 'react';
import { AppNotification } from '@/lib/types';
import { Bell, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/service/apiService';
import { triggerHaptic } from '@/lib/native';

export const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = async () => {
    const list = await api.notifications.getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleClearAll = async () => {
    triggerHaptic('light');
    await api.notifications.clearNotifications();
    setNotifications([]);
  };

  const handleMarkAsRead = async (id: string) => {
    triggerHaptic('select');
    await api.notifications.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="flex flex-col h-full w-full select-none p-4 overflow-y-auto animate-in fade-in duration-200 gap-4">
      {/* Шапка уведомлений */}
      <div className="bg-white text-stone-900 border border-slate-200 dark:bg-[#2e1d61] dark:text-stone-100 dark:border-purple-600/30 font-mono py-2.5 px-4 rounded-xl font-bold shadow-sm flex items-center justify-between">
        <span className="flex-1 text-center font-bold">Центр уведомлений</span>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-stone-400 hover:text-rose-500 transition cursor-pointer p-1 rounded-lg"
            title="Очистить все"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-[#141418] rounded-3xl p-10 text-center border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center gap-3 animate-pop-in">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-purple-950/40 text-[#5516ea] dark:text-purple-400 flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Все уведомления прочитаны
              </h4>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-[220px]">
                Здесь будут появляться оповещения о дропах заданий дня и сообщениях.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id)}
              className={`bg-white dark:bg-[#141418] rounded-3xl p-4 shadow-sm flex items-start gap-3 border transition cursor-pointer active:scale-[0.99] animate-fade-in ${
                !n.read
                  ? 'border-purple-300 dark:border-purple-800/80 bg-purple-50/20 dark:bg-purple-950/20'
                  : 'border-slate-200 dark:border-white/10'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#ded7fc] dark:bg-purple-950/80 text-[#5516ea] dark:text-purple-300 flex items-center justify-center shrink-0">
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                    {n.title}
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#5516ea] dark:bg-purple-400 shrink-0" />
                    )}
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                    {n.timeText}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  {n.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
