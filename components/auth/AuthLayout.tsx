'use client';

import React from 'react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="relative w-full min-h-screen bg-white text-stone-900 flex flex-col justify-between overflow-hidden select-none">
      {/* Верхний декоративный органический градиент (Top-Right Wave) */}
      <div className="absolute top-0 right-0 w-[80%] max-w-[340px] h-[220px] pointer-events-none z-0">
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

      {/* Нижний декоративный органический градиент (Bottom-Left Circle/Wave) */}
      <div className="absolute bottom-0 left-0 w-[70%] max-w-[280px] h-[200px] pointer-events-none z-0">
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
      <div className="relative z-10 w-full max-w-sm mx-auto flex-1 flex flex-col justify-center px-8 py-16">
        <h1 className="font-mono text-3xl font-medium tracking-wider text-center text-stone-900 mb-8">
          {title}
        </h1>

        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};
