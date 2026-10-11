'use client';

import React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'purple' | 'lightPurple' | 'outline' | 'success' | 'warning';
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'lightPurple',
  className = '',
  onClick,
}) => {
  const base = 'inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-medium transition-all select-none';

  const variants = {
    lightPurple: 'bg-[#ded7fc] dark:bg-purple-950/70 text-[#5519db] dark:text-purple-300 border border-transparent dark:border-purple-800/40',
    purple: 'bg-[#5519db] text-white',
    outline: 'border border-slate-200 dark:border-white/10 text-[#5519db] dark:text-purple-300 bg-white/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10',
    success: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50',
    warning: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-800/50',
  }[variant];

  const clickable = onClick ? 'cursor-pointer hover:opacity-85 active:scale-95' : '';

  return (
    <span
      onClick={onClick}
      className={`${base} ${variants} ${clickable} ${className}`}
    >
      {label}
    </span>
  );
};
