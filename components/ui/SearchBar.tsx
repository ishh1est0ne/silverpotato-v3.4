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
      <div className="absolute left-3 flex items-center justify-center w-7 h-7 rounded-lg bg-[#2b1055] text-white">
        <Search size={16} strokeWidth={2.5} />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white text-stone-900 placeholder-stone-700 font-mono text-base py-3 pl-12 pr-10 rounded-xl shadow-md border-0 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3.5 text-stone-400 hover:text-stone-600 transition p-1"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
