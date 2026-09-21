'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'accent'
    | 'skip'
    | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
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
    'inline-flex items-center justify-center font-sans font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none cursor-pointer select-none';

  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs gap-1.5 min-w-[36px]',
    md: 'h-11 px-4 text-xs sm:text-sm gap-2 min-w-[44px]',
    lg: 'h-12 px-6 text-sm sm:text-base gap-2.5 min-w-[48px]',
    icon: 'h-10 w-10 p-0 rounded-xl shrink-0',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.45)] border border-indigo-400/40',
    secondary:
      'bg-[#0E152E]/90 hover:bg-[#141D3D] text-slate-200 hover:text-white border border-white/[0.09] shadow-sm',
    outline:
      'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white border border-white/[0.14] hover:border-indigo-400/40',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white border-transparent',
    danger:
      'bg-rose-600/90 hover:bg-rose-500 text-white shadow-sm border border-rose-400/30',
    success:
      'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-sm border border-emerald-400/30',
    accent:
      'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-sm hover:shadow-[0_4px_16px_rgba(14,165,233,0.35)]',
    skip:
      'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.08] text-xs font-medium',
    subtle:
      'bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.06]',
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
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;

