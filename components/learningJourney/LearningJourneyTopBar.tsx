'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Bell, ChevronDown, User, LogOut, Settings, Award } from 'lucide-react';

interface LearningJourneyTopBarProps {
  learnerName: string;
}

export const LearningJourneyTopBar: React.FC<LearningJourneyTopBarProps> = ({ learnerName }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const initial = learnerName ? learnerName.charAt(0).toUpperCase() : 'V';

  return (
    <header className="w-full h-11 sm:h-14 md:h-16 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EBE7DF] px-3 sm:px-6 md:px-8 flex items-center justify-between select-none z-20 shrink-0 sticky top-0">
      {/* Left: Breadcrumb / Section Title */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#E8F5EE] text-[#0F5132] flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <span className="font-sans font-bold text-xs sm:text-base text-slate-800">
          Learn / Class
        </span>
      </div>

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
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
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
