'use client';

import React from 'react';
import { X, Sun, Moon, Bell, BellOff, Vibrate, Database, CheckCircle, RefreshCw, Sparkles, Sliders } from 'lucide-react';
import { triggerHaptic } from '@/lib/native';
import { isCustomBackendConfigured, customApiUrl } from '@/lib/service/apiService';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  receiveTasksEnabled: boolean;
  onReceiveTasksChange: (enabled: boolean) => void;
  hapticEnabled?: boolean;
  onHapticChange?: (enabled: boolean) => void;
  onResetDemoData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  receiveTasksEnabled,
  onReceiveTasksChange,
  hapticEnabled = true,
  onHapticChange,
  onResetDemoData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border transition-all ${
          theme === 'dark'
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-100 text-stone-900'
        }`}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5516ea]/10 text-[#5516ea] flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Настройки</h3>
              <p className="text-[11px] font-mono text-stone-400">Параметры приложения</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('select');
              onClose();
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition ${
              theme === 'dark' ? 'bg-stone-800 hover:bg-stone-700 text-stone-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-500'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Список настроек */}
        <div className="flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto pr-1">
          {/* 1. Тема оформления: Белая / Темная */}
          <div
            className={`rounded-2xl p-3.5 border flex flex-col gap-2.5 ${
              theme === 'dark' ? 'bg-stone-800/60 border-stone-700/60' : 'bg-purple-50/50 border-purple-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Тема оформления</span>
              <span className="text-[11px] font-mono text-[#5516ea] font-medium">
                {theme === 'dark' ? 'Тёмная' : 'Светлая'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('select');
                  onThemeChange('light');
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                  theme === 'light'
                    ? 'bg-[#5516ea] text-white shadow-md'
                    : 'bg-white/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:brightness-95 border border-stone-200 dark:border-stone-700'
                }`}
              >
                <Sun size={15} />
                <span>Светлая</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('select');
                  onThemeChange('dark');
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                  theme === 'dark'
                    ? 'bg-[#5516ea] text-white shadow-md'
                    : 'bg-white/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:brightness-95 border border-stone-200 dark:border-stone-700'
                }`}
              >
                <Moon size={15} />
                <span>Тёмная</span>
              </button>
            </div>
          </div>

          {/* 2. Получение заданий (раз в 15 минут) */}
          <div
            className={`rounded-2xl p-3.5 border flex items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-stone-800/60 border-stone-700/60' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  receiveTasksEnabled
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                }`}
              >
                {receiveTasksEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              </div>
              <div>
                <p className="font-bold text-xs leading-tight">Получение заданий</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-0.5 leading-snug">
                  Дроп заданий каждые 15 минут и оповещения о челленджах
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('select');
                onReceiveTasksChange(!receiveTasksEnabled);
              }}
              className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                receiveTasksEnabled ? 'bg-[#5516ea]' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  receiveTasksEnabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Тактильный отклик (Haptic) */}
          {onHapticChange && (
            <div
              className={`rounded-2xl p-3.5 border flex items-center justify-between gap-3 ${
                theme === 'dark' ? 'bg-stone-800/60 border-stone-700/60' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    hapticEnabled ? 'bg-purple-100 text-[#5516ea]' : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                  }`}
                >
                  <Vibrate size={16} />
                </div>
                <div>
                  <p className="font-bold text-xs leading-tight">Тактильный отклик</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                    Вибрация при кликах и лайках
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('select');
                  onHapticChange(!hapticEnabled);
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                  hapticEnabled ? 'bg-[#5516ea]' : 'bg-stone-300 dark:bg-stone-700'
                }`}
              >
                <div
                  className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    hapticEnabled ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* 4. Статус сервера */}
          <div
            className={`rounded-2xl p-3.5 border flex flex-col gap-1.5 text-left text-xs ${
              theme === 'dark' ? 'bg-[#181822] border-white/10' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between font-mono text-[11px] text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5 font-bold">
                <Database size={13} className="text-[#5516ea]" />
                Сервер Proxmox VE:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle size={12} />
                {isCustomBackendConfigured ? 'Подключен (Tailscale)' : 'Автономный'}
              </span>
            </div>
            <p className="font-mono text-[10px] text-stone-400 break-all">
              {customApiUrl || 'Local Mock Engine (Offline mode)'}
            </p>
            <div className="pt-1 border-t border-stone-200/50 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-stone-400">
              <span>Сеть: Tailnet rudkovskijd836@</span>
              <span className="text-emerald-500 font-semibold">Port 4000 OK</span>
            </div>
          </div>

          {/* 5. Кнопка сброса тестовых данных */}
          {onResetDemoData && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                if (confirm('Сбросить тестовые задания и комментарии к исходному состоянию?')) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="py-2.5 px-3 rounded-2xl border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Очистить кэш заданий</span>
            </button>
          )}

          {/* Инфо */}
          <div className="text-center font-mono text-[10px] text-stone-400 pt-1 flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-[#5516ea]" />
            <span>Фото-Квесты Silverfish v3.9 Pre-Release</span>
          </div>
        </div>

        {/* Кнопка готово */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('select');
            onClose();
          }}
          className="w-full py-2.5 rounded-full bg-[#5516ea] text-white font-mono text-xs font-bold hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md"
        >
          Готово
        </button>
      </div>
    </div>
  );
};
