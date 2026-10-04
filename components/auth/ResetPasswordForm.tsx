'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { InputField } from '../ui/InputField';
import { PillButton } from '../ui/PillButton';
import { api } from '@/lib/service/apiService';
import { triggerHaptic } from '@/lib/native';

export interface ResetPasswordFormProps {
  /** Токен из ссылки. null: режим Supabase, где сессия восстановления уже есть */
  token: string | null;
  onDone: () => void;
  onCancel: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  onDone,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      triggerHaptic('warning');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      triggerHaptic('warning');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await api.auth.confirmPasswordReset(token, password);
      await triggerHaptic('success');
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить пароль');
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <InputField
        type={showPassword ? 'text' : 'password'}
        placeholder="Новый пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock size={20} />}
        rightIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        onRightIconClick={() => setShowPassword(!showPassword)}
        required
      />
      <InputField
        type={showPassword ? 'text' : 'password'}
        placeholder="Повторите пароль"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        leftIcon={<Lock size={20} />}
        required
      />

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-mono text-center">
          {error}
        </div>
      )}

      <div className="mt-4">
        <PillButton type="submit" isLoading={isLoading} className="w-full">
          СОХРАНИТЬ ПАРОЛЬ
        </PillButton>
      </div>

      <div className="text-center mt-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-mono text-[#5b25e8] hover:underline cursor-pointer"
        >
          Вернуться ко входу
        </button>
      </div>
    </form>
  );
};
