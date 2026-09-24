'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Bell, ChevronDown, User, LogOut, Settings, Award } from 'lucide-react';

import { XpeditionLogo } from '@/components/XpeditionLogo';

interface LearningJourneyTopBarProps {
  learnerName: string;
}

export const LearningJourneyTopBar: React.FC<LearningJourneyTopBarProps> = ({ learnerName }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const initial = learnerName ? learnerName.charAt(0).toUpperCase() : 'L';

  return (
    <header className="w-full h-11 sm:h-14 md:h-16 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EBE7DF] px-3 sm:px-6 md:px-8 flex items-center justify-between select-none z-20 shrink-0 sticky top-0">
      {/* Left: XPEDITION Logo Wordmark */}
      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#184E38] rounded-lg"
        aria-label="Xpedition Home"
      >
        <div className="flex items-center gap-2">
          {/* Logo Mark */}
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 drop-shadow-2xs"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M18 18 C14 8 8 4 5 7 C2 10 6 16 18 18 Z" fill="#1B5E43" />
            <path d="M17 17 C13.5 9 8.5 6 6 8.5 C3.5 11 7 15 17 17 Z" fill="#32956D" opacity="0.65" />
            <path d="M18 18 C22 8 28 4 31 7 C34 10 30 16 18 18 Z" fill="#16513A" />
            <path d="M19 17 C22.5 9 27.5 6 30 8.5 C32.5 11 29 15 19 17 Z" fill="#2C8862" opacity="0.65" />
            <path d="M18 18 C14 28 8 32 5 29 C2 26 6 20 18 18 Z" fill="#134733" />
            <path d="M17 19 C13.5 27 8.5 30 6 27.5 C3.5 25 7 21 17 19 Z" fill="#277D5A" opacity="0.65" />
            <path d="M18 18 C22 28 28 32 31 29 C34 26 30 20 18 18 Z" fill="#1B5E43" />
            <path d="M19 19 C22.5 27 27.5 30 30 27.5 C32.5 25 29 21 19 19 Z" fill="#32956D" opacity="0.65" />
            <circle cx="18" cy="18" r="2.2" fill="#0E3827" />
          </svg>
          <span className="font-sans font-extrabold text-sm sm:text-lg tracking-[0.14em] text-slate-900 leading-none">
            XPEDITION
          </span>
        </div>
      </Link>

      {/* Right: Search, Notifications, Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Search Toggle / Input */}
        <div className="relative">
          {showSearch ? (
            <div className="flex items-center bg-white border border-[#D5CFBF] rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 shadow-sm animate-fadeIn">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 mr-1.5 sm:mr-2 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search concepts..."
                className="w-28 sm:w-48 text-[11px] sm:text-xs font-sans text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                onBlur={() => setShowSearch(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              aria-label="Search concepts"
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full hover:bg-[#EFECE3] text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-full hover:bg-[#EFECE3] text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 ring-2 ring-[#FAF8F5]" />
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="User profile menu"
            className="flex items-center gap-1 p-0.5 sm:p-1 rounded-full hover:bg-[#EFECE3] transition-colors"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#184E38] text-white flex items-center justify-center font-sans font-bold text-[11px] sm:text-xs shadow-xs">
              {initial}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-[#EBE7DF] shadow-lg py-2 z-50 animate-fadeIn"
              onMouseLeave={() => setShowMenu(false)}
            >
              <div className="px-4 py-2 border-b border-[#F0ECE1]">
                <p className="font-sans font-bold text-xs text-slate-900 truncate">{learnerName}</p>
                <p className="font-sans text-[11px] text-slate-500">Explorer Account</p>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-sans text-slate-700 hover:bg-[#F7F4E9] transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                Profile & Goals
              </Link>
              <Link
                href="/passport"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-sans text-slate-700 hover:bg-[#F7F4E9] transition-colors"
              >
                <Award className="w-4 h-4 text-slate-500" />
                Your Passports
              </Link>
              <Link
                href="/profile#settings"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-sans text-slate-700 hover:bg-[#F7F4E9] transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                Settings
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default LearningJourneyTopBar;
