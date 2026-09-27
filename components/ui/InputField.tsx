'use client';

import React, { forwardRef } from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  error?: string;
  containerClassName?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, leftIcon, rightIcon, onRightIconClick, error, containerClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label className="text-xs font-mono font-medium text-stone-600 px-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-4 flex items-center pointer-events-none text-[#5b25e8]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`w-full bg-[#f1f1f5] text-stone-800 placeholder-stone-400 font-mono text-base py-3 rounded-full border border-stone-200/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#5b25e8] focus:ring-2 focus:ring-[#5b25e8]/20 transition-all ${
              leftIcon ? 'pl-12' : 'pl-5'
            } ${rightIcon ? 'pr-12' : 'pr-5'} ${className}`}
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              tabIndex={-1}
              className="absolute right-4 flex items-center text-[#5b25e8] hover:opacity-80 active:scale-95 transition-transform"
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-rose-500 px-3">{error}</span>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
