'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { InputField } from '../ui/InputField';
import { PillButton } from '../ui/PillButton';
import { api } from '@/lib/service/apiService';

export interface ForgotPasswordFormProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onNavigateToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
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
      await api.auth.resetPassword(email);
      setIsSent(true);
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
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
          <h3 className="font-mono text-lg font-semibold text-stone-800">
            Ссылка отправлена!
          </h3>
          <p className="text-xs font-mono text-stone-500">
            Мы отправили инструкцию по сбросу пароля на адрес <span className="font-bold">{email}</span>.
          </p>
          <div className="mt-4 w-full">
            <PillButton onClick={onNavigateToLogin} className="w-full">
              Back to Sign in
            </PillButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <InputField
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={20} />}
            required
          />

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-mono text-center">
              {error}
            </div>
          )}

          <div className="mt-4">
            <PillButton type="submit" isLoading={isLoading} className="w-full">
              SEND RESET LINK
            </PillButton>
          </div>

          <div className="text-center mt-3">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs font-mono text-[#5b25e8] hover:underline cursor-pointer"
            >
              Back to Sign in
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
