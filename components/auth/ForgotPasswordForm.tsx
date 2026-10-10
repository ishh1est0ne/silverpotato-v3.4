'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { InputField } from '../ui/InputField';
import { PillButton } from '../ui/PillButton';
import { api } from '@/lib/service/apiService';

export interface ForgotPasswordFormProps {
  onNavigateToLogin: () => void;
  onNavigateToReset?: (token: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onNavigateToLogin,
  onNavigateToReset,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Введите e-mail для сброса пароля');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.auth.resetPassword(email);
      setIsSent(true);
      if (res?.demoToken) {
        setDemoToken(res.demoToken);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось отправить ссылку. Проверьте адрес.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {isSent ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center animate-fade-in">
          <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
          <h3 className="font-mono text-lg font-semibold text-stone-800 dark:text-stone-100">
            Запрос принят!
          </h3>
          <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
            Инструкция по восстановлению создана для адреса <span className="font-bold text-stone-800 dark:text-stone-200">{email}</span>.
          </p>

          <div className="mt-4 flex flex-col gap-2 w-full">
            {demoToken && onNavigateToReset && (
              <PillButton onClick={() => onNavigateToReset(demoToken)} className="w-full">
                Ввести новый пароль прямо сейчас
              </PillButton>
            )}
            <PillButton variant="outline" onClick={onNavigateToLogin} className="w-full">
              Вернуться ко входу
            </PillButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <InputField
            type="email"
            placeholder="Почта (E-mail)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={20} />}
            required
          />

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-mono text-center border border-rose-200 dark:border-rose-900/50">
              {error}
            </div>
          )}

          <div className="mt-4">
            <PillButton type="submit" isLoading={isLoading} className="w-full">
              СБРОСИТЬ ПАРОЛЬ
            </PillButton>
          </div>

          <div className="text-center mt-3">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs font-mono text-[#5b25e8] dark:text-purple-400 hover:underline cursor-pointer"
            >
              Вернуться ко входу
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
