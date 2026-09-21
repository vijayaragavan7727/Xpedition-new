'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  position?: 'bottom' | 'right';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  position = 'bottom',
  className = '',
}) => {
  // Prevent body scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#060B18]/70 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      {position === 'bottom' ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`relative mt-auto w-full max-w-2xl mx-auto rounded-t-3xl bg-[#0E152E]/95 border-t border-x border-white/[0.1] backdrop-blur-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.7)] flex flex-col max-h-[85vh] z-10 transition-transform duration-300 ease-out transform translate-y-0 ${className}`}
        >
          {/* Swipe / drag indicator pill */}
          <div className="w-full flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 rounded-full bg-white/[0.2] hover:bg-white/[0.3] transition-colors" />
          </div>

          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] shrink-0">
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-indigo-300">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="font-sans font-bold text-sm sm:text-base text-white tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="font-sans text-xs text-slate-400 font-normal">{subtitle}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="p-5 overflow-y-auto flex-1 text-slate-200 select-text">
            {children}
          </div>
        </div>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`relative ml-auto w-full max-w-md h-full bg-[#0E152E]/95 border-l border-white/[0.1] backdrop-blur-2xl shadow-[-12px_0_40px_rgba(0,0,0,0.7)] flex flex-col z-10 transition-transform duration-300 ease-out ${className}`}
        >
          {/* Right Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-indigo-300">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="font-sans font-bold text-sm sm:text-base text-white tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="font-sans text-xs text-slate-400 font-normal">{subtitle}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="p-5 overflow-y-auto flex-1 text-slate-200 select-text">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Drawer;
