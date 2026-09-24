'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'tertiary'
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
    'inline-flex items-center justify-center font-sans font-semibold rounded-[10px] transition-colors duration-150 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-[#0B7066]/50 focus-visible:outline-none cursor-pointer select-none';

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs gap-1.5 min-w-[36px] rounded-lg',
    md: 'h-11 px-4 text-xs sm:text-sm gap-2 min-w-[44px] rounded-[10px]',
    lg: 'h-12 px-6 text-sm sm:text-base gap-2.5 min-w-[48px] rounded-xl',
    icon: 'h-10 w-10 p-0 rounded-[10px] shrink-0',
  };

  const variantStyles = {
    primary:
      'bg-[#004741] hover:bg-[#075C55] active:bg-[#0B7066] text-white border border-[#17655E] shadow-sm',
    secondary:
      'bg-[#F0EDE4] hover:bg-[#E5E0D5] active:bg-[#D4CEBF] text-[#080B0D] font-bold border border-[#E5E0D5] shadow-sm',
    outline:
      'bg-transparent hover:bg-white/[0.06] active:bg-white/[0.09] text-white border border-[#263130] hover:border-[#17655E]',
    tertiary:
      'bg-transparent hover:bg-white/[0.06] active:bg-white/[0.09] text-white border border-[#263130] hover:border-[#17655E]',
    ghost:
      'bg-transparent hover:bg-white/[0.06] active:bg-white/[0.09] text-[#8E9693] hover:text-white border-transparent',
    danger:
      'bg-[#A83232] hover:bg-[#8F2828] text-white border border-[#8F2828]',
    success:
      'bg-[#004741] hover:bg-[#075C55] text-white border border-[#17655E]',
    accent:
      'bg-[#075C55] hover:bg-[#0B7066] text-white border border-[#17655E]',
    skip:
      'bg-transparent hover:bg-white/[0.05] text-[#8E9693] hover:text-white border border-[#263130] text-xs font-medium',
    subtle:
      'bg-[#1B2221] hover:bg-[#263130] text-white border border-[#263130]',
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
