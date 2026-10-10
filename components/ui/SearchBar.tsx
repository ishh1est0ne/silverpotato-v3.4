'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = '#имя друга',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3 flex items-center justify-center w-7 h-7 rounded-lg bg-[#2b1055] dark:bg-purple-900/60 text-white">
        <Search size={16} strokeWidth={2.5} />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-[#141418] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 font-mono text-sm py-3 pl-12 pr-10 rounded-xl shadow-md border border-transparent dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition p-1 cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
