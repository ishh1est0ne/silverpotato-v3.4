'use client';

import React, { useState, useRef } from 'react';
import { User, LogOut, Sliders, ShieldCheck, Zap, Award, Edit3, Check, X, Camera, Loader2, AtSign } from 'lucide-react';
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
  onOpenSettings,
  onUserNameUpdated,
}) => {
  const isAdmin = user?.role === 'admin';
  const takenToday = user?.dailyTasksTakenToday ?? 0;
  const remainingTakes = Math.max(0, 2 - takenToday);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  const displayName = user?.name || (user?.username ? `@${user.username}` : (user?.email || 'Пользователь'));
  const rawUsername = user?.username || (user?.name ? user.name.toLowerCase().replace(/[^a-z0-9_]/gi, '') : 'user');
  const displayUsername = `@${rawUsername.replace(/^@+/, '')}`;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    triggerHaptic('light');

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      if (!rawUrl) {
        setIsUploadingAvatar(false);
        return;
      }

      const img = new Image();
      img.onload = async () => {
        const maxDim = 360;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarPreview(compressed);
          try {
            await api.auth.updateProfile({ avatarUrl: compressed });
            if (onUserNameUpdated) {
              onUserNameUpdated(editedName || displayName);
            }
            triggerHaptic('success');
          } catch {
            triggerHaptic('error');
          }
        }
        setIsUploadingAvatar(false);
      };
      img.onerror = () => setIsUploadingAvatar(false);
      img.src = rawUrl;
    };
    reader.onerror = () => setIsUploadingAvatar(false);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) return;
    setIsSaving(true);
    triggerHaptic('light');
    try {
      await api.auth.updateProfile({
        name: editedName.trim(),
        username: editedUsername.trim().replace(/^@+/, ''),
      });
      triggerHaptic('success');
      setIsEditingProfile(false);
      if (onUserNameUpdated) {
        onUserNameUpdated(editedName.trim());
      }
    } catch {
      triggerHaptic('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none p-4 overflow-y-auto gap-4 animate-in fade-in duration-200">
      {/* Шапка профиля */}
      <div className="bg-white text-stone-900 border border-slate-200 dark:bg-[#141418] dark:text-stone-100 dark:border-white/10 font-mono text-center py-2.5 px-4 rounded-2xl font-bold shadow-xs flex items-center justify-between">
        <span className="flex-1 text-center font-bold text-sm tracking-wide">Мой Профиль</span>
        {onOpenSettings && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('select');
              onOpenSettings();
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-stone-800 dark:text-stone-200 flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0"
            title="Настройки"
          >
            <Sliders size={16} />
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#141418] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col items-center gap-4 text-center animate-pop-in">
        {/* Аватар с возможностью загрузить свою фотку */}
        <div className="relative group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full bg-[#ded7fc] dark:bg-purple-950/80 text-[#5516ea] dark:text-purple-300 flex items-center justify-center shadow-inner border-2 border-purple-200 dark:border-purple-800 font-mono font-extrabold text-3xl cursor-pointer relative overflow-hidden group-hover:opacity-90 transition"
            title="Нажмите, чтобы изменить аватарку"
          >
            {avatarPreview || user?.avatarUrl ? (
              <img
                src={avatarPreview || user?.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : displayName ? (
              displayName.charAt(0).toUpperCase()
            ) : (
              <User size={44} />
            )}

            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                <Loader2 size={24} className="animate-spin" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-[#5516ea] hover:bg-purple-700 text-white p-2 rounded-full shadow-md border-2 border-white dark:border-[#141418] cursor-pointer transition active:scale-90"
            title="Загрузить аватарку"
          >
            <Camera size={14} />
          </button>

          {isAdmin && (
            <div
              className="absolute top-0 right-0 bg-amber-400 text-stone-900 p-1.5 rounded-full shadow-md border-2 border-white dark:border-[#141418]"
              title="Администратор"
            >
              <ShieldCheck size={14} />
            </div>
          )}
        </div>

        {/* Имя и Юзернейм */}
        <div className="w-full">
          {isEditingProfile ? (
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#181822] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10">
                <User size={15} className="text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Имя пользователя..."
                  className="bg-transparent text-stone-900 dark:text-stone-100 font-mono text-sm focus:outline-none w-full"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#181822] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10">
                <AtSign size={15} className="text-[#5516ea] dark:text-purple-400 shrink-0" />
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  placeholder="юзернейм (например piskasos98)"
                  className="bg-transparent text-stone-900 dark:text-stone-100 font-mono text-sm focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 py-1.5 rounded-xl bg-[#5516ea] text-white font-mono text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Check size={14} />
                  <span>Сохранить</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <X size={14} />
                  <span>Отмена</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
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
                    setEditedName(user?.name || displayName);
                    setEditedUsername(rawUsername);
                    setIsEditingProfile(true);
                  }}
                  className="text-stone-400 hover:text-[#5516ea] dark:hover:text-purple-300 transition p-1 cursor-pointer"
                  title="Редактировать профиль"
                >
                  <Edit3 size={15} />
                </button>
              </div>

              {/* Отображение юзернейма с @ (Requirement 2) */}
              <p className="text-xs font-mono text-[#5516ea] dark:text-purple-400 font-bold mt-1">
                {displayUsername}
              </p>
            </div>
          )}
        </div>

        {/* Параметры пользователя */}
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

        {/* Единая кнопка настроек и кнопка выхода (Requirement 3: без дублирующих панелей) */}
        <div className="w-full pt-2 flex flex-col gap-2.5">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('select');
                onOpenSettings();
              }}
              className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-stone-800 font-mono text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 shadow-xs"
            >
              <Sliders size={15} className="text-[#5516ea] dark:text-purple-400" />
              <span>Параметры и настройки</span>
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
