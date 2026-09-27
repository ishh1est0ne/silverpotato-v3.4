'use client';

import React from 'react';
import { User, LogOut, Database, CheckCircle } from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { PillButton } from '../ui/PillButton';

export interface ProfileScreenProps {
  user: UserType | null;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
}) => {
  return (
    <div className="flex flex-col h-full w-full select-none p-4 overflow-y-auto">
      {/* Шапка профиля */}
      <div className="bg-[#c6baf9] text-stone-900 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-md mb-6">
        Профиль пользователя
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-[#ded7fc] text-[#5516ea] flex items-center justify-center shadow-inner">
          <User size={44} />
        </div>

        <div>
          <h2 className="font-bold text-xl text-stone-900">
            {user?.name || 'Пользователь'}
          </h2>
          <p className="text-xs font-mono text-stone-400 mt-0.5">
            {user?.email || 'user@example.com'}
          </p>
        </div>

        {/* Статус бэкенда */}
        <div className="w-full bg-purple-50 rounded-2xl p-4 border border-purple-100 flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#5516ea]">
            <Database size={15} />
            <span>Текущий режим базы данных:</span>
          </div>

          <div className="text-xs font-sans text-stone-600">
            {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle size={14} /> Подключен Proxmox сервер ({process.env.NEXT_PUBLIC_API_URL})
              </span>
            ) : isSupabaseConfigured ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle size={14} /> Подключен облачный Supabase
              </span>
            ) : (
              <span className="text-amber-800">
                Локальный режим (Local Mock DB). Для работы через ваш Proxmox укажите <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> или подключите Supabase.
              </span>
            )}
          </div>
        </div>

        <div className="w-full pt-4">
          <PillButton
            variant="outline"
            onClick={onLogout}
            className="w-full border-rose-300 text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={16} />
            Выйти из аккаунта
          </PillButton>
        </div>
      </div>
    </div>
  );
};
