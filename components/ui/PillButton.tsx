'use client';

import React from 'react';

export interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseStyles = 'rounded-full font-mono font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-3.5 px-6 text-sm',
    lg: 'py-4 px-8 text-base',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#6b25e8] via-[#5415e8] to-[#4320df] text-white shadow-md hover:shadow-lg hover:brightness-105 active:shadow-inner',
    secondary:
      'bg-[#ded6fb] text-[#4f18d6] hover:bg-[#d4c9f9] shadow-sm',
    outline:
      'border-2 border-[#5415e8] text-[#5415e8] bg-transparent hover:bg-[#5415e8]/5',
    ghost:
      'text-[#5415e8] hover:bg-stone-100 bg-transparent',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};
