'use client';

import React from 'react';
import { Code, User, Bell, MessageSquare } from 'lucide-react';
import { triggerHaptic } from '@/lib/native';

export type AppTab = 'tasks' | 'messages' | 'profile' | 'notifications';

export interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadMessages = 0,
  unreadNotifications = 0,
}) => {
  const handleTab = (tab: AppTab) => {
    triggerHaptic('select');
    onTabChange(tab);
  };

  return (
    <div className="w-full bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-6 py-3 flex items-center justify-around relative select-none pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* 1. Таб: Задания */}
      <button
        type="button"
        onClick={() => handleTab('tasks')}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
          activeTab === 'tasks' ? 'text-[#5516ea] scale-110' : 'text-stone-400 hover:text-stone-600'
        }`}
        title="Задания"
      >
        <div className="w-8 h-8 flex items-center justify-center font-bold">
          <Code size={24} strokeWidth={2.5} />
        </div>
      </button>

      {/* 2. Таб: Сообщения */}
      <button
        type="button"
        onClick={() => handleTab('messages')}
        className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
          activeTab === 'messages' ? 'text-[#5516ea] scale-110' : 'text-stone-400 hover:text-stone-600'
        }`}
        title="Сообщения"
      >
        <div className="w-8 h-8 flex items-center justify-center">
          <MessageSquare size={22} strokeWidth={2.2} />
        </div>
        {unreadMessages > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* 3. Таб: Профиль (Центральная приподнятая кнопка) */}
      <div className="-mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={() => handleTab('profile')}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#5516ea] text-white ring-4 ring-purple-200'
              : 'bg-[#5516ea] text-white hover:brightness-110'
          }`}
          title="Профиль"
        >
          <User size={28} strokeWidth={2.2} />
        </button>
      </div>

      {/* 4. Таб: Уведомления */}
      <button
        type="button"
        onClick={() => handleTab('notifications')}
        className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
          activeTab === 'notifications' ? 'text-[#5516ea] scale-110' : 'text-stone-400 hover:text-stone-600'
        }`}
        title="Уведомления"
      >
        <div className="w-8 h-8 flex items-center justify-center">
          <Bell size={24} strokeWidth={2.2} />
        </div>
        {unreadNotifications > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  );
};
