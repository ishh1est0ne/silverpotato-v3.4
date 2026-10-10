'use client';

import React, { useState, useEffect } from 'react';
import { AppNotification } from '@/lib/types';
import { Bell } from 'lucide-react';
import { api } from '@/lib/service/apiService';

export const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    api.notifications.getNotifications().then(setNotifications);
  }, []);

  return (
    <div className="flex flex-col h-full w-full select-none p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#c6baf9] dark:bg-[#2e1d61] text-stone-900 dark:text-stone-100 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-md mb-4">
        Уведомления
      </div>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="bg-white/90 dark:bg-[#141418] rounded-3xl p-8 text-center text-stone-500 dark:text-stone-400 font-mono text-sm border border-stone-100 dark:border-white/10 shadow-sm animate-pop-in">
            Нет новых уведомлений
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="bg-white dark:bg-[#141418] rounded-3xl p-4 shadow-md flex items-start gap-3 border border-purple-100 dark:border-white/10 animate-fade-in"
            >
              <div className="w-10 h-10 rounded-full bg-[#ded7fc] dark:bg-purple-950/80 text-[#5516ea] dark:text-purple-300 flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">{n.title}</h4>
                  <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                    {n.timeText}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">{n.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
