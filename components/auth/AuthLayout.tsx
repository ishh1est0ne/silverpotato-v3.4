'use client';

import React from 'react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="relative w-full h-full bg-white dark:bg-[#0c0c10] text-stone-900 dark:text-stone-100 flex flex-col justify-between overflow-hidden select-none transition-colors duration-200">
      {/* Верхний декоративный градиент */}
      <div className="absolute top-0 right-0 w-[80%] max-w-[340px] h-[220px] pointer-events-none z-0 opacity-90">
        <svg
          viewBox="0 0 300 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="topWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7a2ef3" />
              <stop offset="60%" stopColor="#5514ea" />
              <stop offset="100%" stopColor="#3d0bc4" />
            </linearGradient>
          </defs>
          <path
            d="M 40 0 C 40 45, 120 70, 160 70 C 210 70, 240 100, 250 150 C 255 175, 270 195, 300 200 L 300 0 Z"
            fill="url(#topWaveGrad)"
          />
        </svg>
      </div>

      {/* Нижний декоративный градиент */}
      <div className="absolute bottom-0 left-0 w-[70%] max-w-[280px] h-[200px] pointer-events-none z-0 opacity-90">
        <svg
          viewBox="0 0 280 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="bottomWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c30f4" />
              <stop offset="70%" stopColor="#5515ea" />
              <stop offset="100%" stopColor="#4310cf" />
            </linearGradient>
          </defs>
          <path
            d="M 0 40 C 60 40, 150 70, 200 130 C 235 170, 260 200, 280 200 L 0 200 Z"
            fill="url(#bottomWaveGrad)"
          />
        </svg>
      </div>

      {/* Основной контент */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex-1 flex flex-col justify-center px-8 py-10 animate-fade-in">
        <div className="mb-6">
          <h1 className="font-bold text-3xl font-mono text-stone-900 dark:text-stone-100 uppercase tracking-wider">
            {title}
          </h1>
          <div className="w-12 h-1 bg-[#5b25e8] dark:bg-purple-500 rounded-full mt-2" />
        </div>

        {children}
      </div>
    </div>
  );
};
