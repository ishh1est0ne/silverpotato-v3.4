'use client';

import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { InputField } from '../ui/InputField';
import { PillButton } from '../ui/PillButton';
import { api } from '@/lib/service/apiService';
import { triggerHaptic } from '@/lib/native';

export interface SignUpFormProps {
  onSuccess: (email: string) => void;
  onNavigateToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('light');

    if (!name || !email || !password) {
      setError('Заполните все поля');
      triggerHaptic('warning');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      triggerHaptic('warning');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await api.auth.signUp(name, email, password);
      await triggerHaptic('success');
      onSuccess(email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка регистрации. Попробуйте еще раз.';
      setError(message);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <InputField
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        leftIcon={<UserIcon size={20} />}
        required
      />

      <InputField
        type="email"
        placeholder="Почта (E-mail)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail size={20} />}
        required
      />

      <InputField
        type={showPassword ? 'text' : 'password'}
        placeholder="Пароль (от 6 символов)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock size={20} />}
        rightIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        onRightIconClick={() => setShowPassword(!showPassword)}
        required
      />

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-mono text-center border border-rose-200 dark:border-rose-900/50">
          {error}
        </div>
      )}

      <div className="mt-4">
        <PillButton type="submit" isLoading={isLoading} className="w-full">
          СОЗДАТЬ АККАУНТ
        </PillButton>
      </div>

      <div className="text-center mt-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('select');
            onNavigateToLogin();
          }}
          className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-[#5516ea] dark:hover:text-purple-400 transition cursor-pointer"
        >
          Уже есть аккаунт? <span className="font-semibold text-[#5516ea] dark:text-purple-400">Войти</span>
        </button>
      </div>
    </form>
  );
};
