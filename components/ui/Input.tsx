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
          <label className="block font-sans text-xs font-semibold text-[#E5E0D5]">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {isSearch && !leftIcon && (
            <div className="absolute left-3.5 text-[#8E9693] pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
          )}

          {leftIcon && !isSearch && (
            <div className="absolute left-3.5 text-[#8E9693] pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            value={value}
            disabled={disabled}
            className={`w-full h-11 px-4 text-sm font-sans rounded-[10px] bg-[#151B1B] text-white placeholder-[#8E9693] border border-[#263130] transition-colors duration-150 focus:border-[#17655E] focus:bg-[#151B1B] focus:ring-2 focus:ring-[#075C55]/35 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
              isSearch || leftIcon ? 'pl-10' : ''
            } ${showClear || rightIcon ? 'pr-10' : ''} ${
              error ? 'border-[#A83232] focus:border-[#A83232] focus:ring-[#A83232]/30' : ''
            } ${className}`}
            {...props}
          />

          {showClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear input"
              className="absolute right-3 p-1 rounded-md text-[#8E9693] hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {rightIcon && !showClear && (
            <div className="absolute right-3.5 text-[#8E9693] pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="font-sans text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="font-sans text-xs text-[#8E9693]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
