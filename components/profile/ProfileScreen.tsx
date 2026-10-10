'use client';

import React, { useState } from 'react';
import { User, LogOut, Sliders, Sun, Moon, Bell, BellOff, ShieldCheck, Zap, Award, Edit3, Check, X } from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { PillButton } from '../ui/PillButton';
import { triggerHaptic } from '@/lib/native';
import { api } from '@/lib/service/apiService';

export interface ProfileScreenProps {
  user: UserType | null;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  receiveTasksEnabled?: boolean;
  onReceiveTasksChange?: (enabled: boolean) => void;
  onOpenSettings?: () => void;
  onUserNameUpdated?: (newName: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
  theme = 'dark',
  onThemeChange,
  receiveTasksEnabled = true,
  onReceiveTasksChange,
  onOpenSettings,
  onUserNameUpdated,
}) => {
  const isAdmin = user?.role === 'admin';
  const takenToday = user?.dailyTasksTakenToday ?? 0;
  const remainingTakes = Math.max(0, 2 - takenToday);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    setIsSaving(true);
    triggerHaptic('light');
    try {
      await api.auth.updateName(editedName.trim());
      triggerHaptic('success');
      setIsEditingName(false);
      if (onUserNameUpdated) {
        onUserNameUpdated(editedName.trim());
      }
    } catch {
      triggerHaptic('error');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = user?.name || user?.email || 'Аккаунт';

  return (
    <div className="flex flex-col h-full w-full select-none p-4 overflow-y-auto gap-4 animate-in fade-in duration-200">
      {/* Шапка профиля */}
      <div className="bg-white text-stone-900 border border-slate-200 dark:bg-[#2e1d61] dark:text-stone-100 dark:border-purple-600/30 font-mono text-center py-2.5 px-4 rounded-xl font-bold shadow-sm flex items-center justify-between">
        <span className="flex-1 text-center">Мой Профиль</span>
        {onOpenSettings && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('select');
              onOpenSettings();
            }}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-stone-800 dark:text-stone-200 flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
            title="Настройки"
          >
            <Sliders size={16} />
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#141418] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col items-center gap-4 text-center animate-pop-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#ded7fc] dark:bg-purple-950/80 text-[#5516ea] dark:text-purple-300 flex items-center justify-center shadow-inner border border-purple-200 dark:border-purple-800 font-mono font-extrabold text-2xl">
            {displayName ? displayName.charAt(0).toUpperCase() : <User size={40} />}
          </div>
          {isAdmin && (
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 p-1 rounded-full shadow border-2 border-white dark:border-[#141418]" title="Администратор">
              <ShieldCheck size={14} />
            </div>
          )}
        </div>

        <div className="w-full">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Ваше имя..."
                className="bg-slate-100 dark:bg-[#181822] text-stone-900 dark:text-stone-100 font-mono text-sm px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSaving}
                className="w-8 h-8 rounded-xl bg-[#5516ea] text-white flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
                title="Сохранить"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
                title="Отмена"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-bold text-xl text-stone-900 dark:text-stone-100">
                {displayName}
              </h2>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
                  ADMIN
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('select');
                  setEditedName(displayName);
                  setIsEditingName(true);
                }}
                className="text-stone-400 hover:text-[#5516ea] dark:hover:text-purple-300 transition p-1"
                title="Редактировать имя"
              >
                <Edit3 size={14} />
              </button>
            </div>
          )}

          <p className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-1">
            {user?.email && user.email !== displayName ? user.email : 'Учетная запись активна'}
          </p>
        </div>

        {/* Реальные параметры пользователя */}
        <div className="w-full grid grid-cols-2 gap-2 text-left">
          <div className="bg-purple-50/70 dark:bg-purple-950/30 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/30 flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <Zap size={11} className="text-[#5516ea] dark:text-purple-400" /> Досрочные задания:
            </span>
            <span className="font-mono text-sm font-bold text-stone-900 dark:text-stone-100">
              {remainingTakes} из 2 ост.
            </span>
          </div>

          <div className="bg-purple-50/70 dark:bg-purple-950/30 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/30 flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <Award size={11} className="text-amber-500" /> Статус:
            </span>
            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {isAdmin ? 'Администратор' : 'В сети'}
            </span>
          </div>
        </div>

        {/* Быстрые настройки прямо в профиле */}
        <div className="w-full bg-slate-50 dark:bg-[#181822] rounded-2xl p-4 border border-slate-200 dark:border-white/10 flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-stone-900 dark:text-stone-100">Тема оформления</span>
            <span className="text-[11px] font-mono text-[#5516ea] dark:text-purple-400 font-medium">
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
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 border border-slate-200 dark:border-white/10'
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
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 border border-slate-200 dark:border-white/10'
                }`}
              >
                <Moon size={14} />
                <span>Тёмная</span>
              </button>
            </div>
          )}

          {/* Переключатель получения заданий */}
          {onReceiveTasksChange && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    receiveTasksEnabled ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'bg-slate-200 dark:bg-stone-700 text-stone-400'
                  }`}
                >
                  {receiveTasksEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                </div>
                <div>
                  <p className="font-bold text-xs text-stone-900 dark:text-stone-100 leading-tight">Задания раз в 15 мин</p>
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
                  receiveTasksEnabled ? 'bg-[#5516ea]' : 'bg-slate-300 dark:bg-stone-700'
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

        <div className="w-full pt-2 flex flex-col gap-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('select');
                onOpenSettings();
              }}
              className="w-full py-2.5 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-stone-800 font-mono text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Sliders size={15} className="text-[#5516ea] dark:text-purple-400" />
              <span>Панель настроек</span>
            </button>
          )}

          <PillButton
            variant="outline"
            onClick={onLogout}
            className="w-full border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <LogOut size={16} />
            Выйти из аккаунта
          </PillButton>
        </div>
      </div>
    </div>
  );
};
