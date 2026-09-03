'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none cursor-pointer';

  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs gap-1.5 min-w-[36px]',
    md: 'h-11 px-4 text-xs sm:text-sm gap-2 min-w-[44px]',
    lg: 'h-12 px-5 text-sm gap-2.5 min-w-[48px]',
  };

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow-[0_4px_16px_rgba(99,102,241,0.35)] border border-indigo-400/30',
    secondary:
      'bg-[#141826] hover:bg-[#1A1F32] text-slate-200 hover:text-white border border-white/[0.1] shadow-xs',
    outline:
      'bg-transparent hover:bg-white/[0.05] text-slate-300 hover:text-white border border-white/[0.12] hover:border-indigo-400/40',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white border-transparent',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-xs border border-rose-400/30',
    accent:
      'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
