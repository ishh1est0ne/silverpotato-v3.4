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
    lightPurple: 'bg-[#ded7fc] text-[#5519db]',
    purple: 'bg-[#5519db] text-white',
    outline: 'border border-[#ded7fc] text-[#5519db] bg-white/70 hover:bg-[#ded7fc]/30',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
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
