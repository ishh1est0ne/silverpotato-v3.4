'use client';

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { InputField } from '../ui/InputField';
import { PillButton } from '../ui/PillButton';
import { api } from '@/lib/service/apiService';

import { triggerHaptic } from '@/lib/native';

export interface LoginFormProps {
  onSuccess: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
  initialEmail?: string;
  successNotice?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onNavigateToForgotPassword,
  initialEmail = '',
  successNotice,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('light');

    if (!email || !password) {
      setError('Заполните e-mail и пароль');
      triggerHaptic('warning');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await api.auth.signIn(email, password);
      await triggerHaptic('success');
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка входа. Проверьте данные.';
      setError(message);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {successNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-mono text-center border border-emerald-200 shadow-xs">
          {successNotice}
        </div>
      )}

      <InputField
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail size={20} />}
        required
      />

      <InputField
        type={showPassword ? 'text' : 'password'}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock size={20} />}
        rightIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        onRightIconClick={() => setShowPassword(!showPassword)}
        required
      />

      <div className="flex justify-end -mt-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('select');
            onNavigateToForgotPassword();
          }}
          className="text-xs font-mono text-[#5b25e8] hover:underline cursor-pointer"
        >
          Forget Password?
        </button>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-mono text-center">
          {error}
        </div>
      )}

      <div className="mt-4">
        <PillButton type="submit" isLoading={isLoading} className="w-full">
          SIGN IN
        </PillButton>
      </div>

      <div className="text-center mt-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('select');
            onNavigateToSignUp();
          }}
          className="text-xs font-mono text-stone-500 hover:text-[#5516ea] transition cursor-pointer"
        >
          Нет аккаунта? <span className="font-semibold text-[#5516ea]">Зарегистрироваться</span>
        </button>
      </div>
    </form>
  );
};
