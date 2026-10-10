'use client';

import React from 'react';
import { User, LogOut, Database, CheckCircle, Sliders, Sun, Moon, Bell, BellOff } from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { PillButton } from '../ui/PillButton';
import { triggerHaptic } from '@/lib/native';

export interface ProfileScreenProps {
  user: UserType | null;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  receiveTasksEnabled?: boolean;
  onReceiveTasksChange?: (enabled: boolean) => void;
  onOpenSettings?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
  theme = 'light',
  onThemeChange,
  receiveTasksEnabled = true,
  onReceiveTasksChange,
  onOpenSettings,
}) => {
  return (
    <div className="flex flex-col h-full w-full select-none p-4 overflow-y-auto gap-4">
      {/* Шапка профиля */}
      <div className="bg-[#c6baf9] text-stone-900 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-md flex items-center justify-between">
        <span className="flex-1 text-center">Профиль пользователя</span>
        {onOpenSettings && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('select');
              onOpenSettings();
            }}
            className="w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-stone-800 flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
            title="Настройки"
          >
            <Sliders size={16} />
          </button>
        )}
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

        {/* Быстрые настройки прямо в профиле */}
        <div className="w-full bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-stone-900">Настройки темы</span>
            <span className="text-[11px] font-mono text-[#5516ea] font-medium">
              {theme === 'dark' ? 'Тёмная' : 'Светлая'}
            </span>
          </div>

          {onThemeChange && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('select');
                  onThemeChange('light');
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  theme === 'light'
                    ? 'bg-[#5516ea] text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Sun size={14} />
                <span>Светлая</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('select');
                  onThemeChange('dark');
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  theme === 'dark'
                    ? 'bg-[#5516ea] text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Moon size={14} />
                <span>Тёмная</span>
              </button>
            </div>
          )}

          {/* Переключатель получения заданий */}
          {onReceiveTasksChange && (
            <div className="flex items-center justify-between pt-2 border-t border-stone-200/80">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    receiveTasksEnabled ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-400'
                  }`}
                >
                  {receiveTasksEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                </div>
                <div>
                  <p className="font-bold text-xs text-stone-900 leading-tight">Задания раз в 15 мин</p>
                  <p className="text-[10px] text-stone-400 font-sans">
                    {receiveTasksEnabled ? 'Включено' : 'Выключено'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('select');
                  onReceiveTasksChange(!receiveTasksEnabled);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                  receiveTasksEnabled ? 'bg-[#5516ea]' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    receiveTasksEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
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

        <div className="w-full pt-2 flex flex-col gap-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('select');
                onOpenSettings();
              }}
              className="w-full py-2.5 rounded-full border border-stone-200 hover:bg-stone-50 font-mono text-xs font-semibold text-stone-700 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Sliders size={15} className="text-[#5516ea]" />
              <span>Панель настроек</span>
            </button>
          )}

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
