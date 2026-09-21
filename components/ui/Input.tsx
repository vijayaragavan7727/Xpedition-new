'use client';

import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isSearch?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isSearch = false,
      onClear,
      className = '',
      type = 'text',
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const showClear = isSearch && Boolean(value) && onClear;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block font-sans text-xs font-semibold text-slate-300">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {isSearch && !leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
          )}

          {leftIcon && !isSearch && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            value={value}
            disabled={disabled}
            className={`w-full h-11 px-4 text-sm font-sans rounded-xl bg-[#0A1024]/90 text-white placeholder-slate-500 border border-white/[0.09] transition-all duration-150 focus:border-indigo-500/70 focus:bg-[#0E152E] focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
              isSearch || leftIcon ? 'pl-10' : ''
            } ${showClear || rightIcon ? 'pr-10' : ''} ${
              error ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30' : ''
            } ${className}`}
            {...props}
          />

          {showClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear input"
              className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {rightIcon && !showClear && (
            <div className="absolute right-3.5 text-slate-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="font-sans text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="font-sans text-xs text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
