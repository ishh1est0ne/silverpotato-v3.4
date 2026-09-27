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
    <div className="flex flex-col h-full w-full select-none p-4 overflow-y-auto">
      <div className="bg-[#c6baf9] text-stone-900 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-md mb-4">
        Уведомления
      </div>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="bg-white/90 rounded-3xl p-8 text-center text-stone-500 font-mono text-sm">
            Нет новых уведомлений
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-3xl p-4 shadow-md flex items-start gap-3 border border-purple-100"
            >
              <div className="w-10 h-10 rounded-full bg-[#ded7fc] text-[#5516ea] flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-sm">{n.title}</h4>
                  <span className="text-[10px] font-mono text-stone-400">
                    {n.timeText}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1">{n.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
