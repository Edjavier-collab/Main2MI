'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Future props can be added here
}

export const SearchBar: React.FC<SearchBarProps> = (props) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-text-muted" />
      </div>
      <input
        type="text"
        className="
          w-full
          pl-12 
          pr-4 
          py-3
          text-base
          rounded-[var(--inset-group-radius)]
          border border-white/40
          bg-white/70
          backdrop-blur-sm
          focus:outline-none 
          focus:ring-2 
          focus:ring-primary/50
          text-text-primary
          placeholder-text-muted
          transition-all
        "
        {...props}
      />
    </div>
  );
};
