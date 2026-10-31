// src/components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../ThemeContext'; 

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all bg-amber-200 text-black dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:shadow-none"
      title="Alternar tema"
    >
      {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
    </button>
  );
}