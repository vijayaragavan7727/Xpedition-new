'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, BookOpen, Map, Award, User } from 'lucide-react';

export interface TabItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: TabItem[] = [
  { name: 'Home', href: '/home', icon: Compass },
  { name: 'Quest', href: '/quest', icon: BookOpen },
  { name: 'World', href: '/world', icon: Map },
  { name: 'Passport', href: '/passport', icon: Award },
  { name: 'Profile', href: '/profile', icon: User },
];

export const TabBar: React.FC = () => {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const idx = navItems.findIndex(
      (item) => pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href))
    );
    if (idx !== -1) {
      setActiveIndex(idx);
    }
  }, [pathname]);

  return (
    <>
      {/* =========================================================================
          MOBILE BOTTOM TAB BAR (< 1024px) - Clean Startup Linear/Duolingo feel
          ========================================================================= */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-white/[0.08] bg-[#0D0F18]/90 backdrop-blur-2xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="relative h-[60px] flex items-center justify-around px-2 max-w-md mx-auto">
          {/* Active indicator bar */}
          <div
            className="absolute top-0 h-[2.5px] w-8 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-b-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_2px_8px_rgba(99,102,241,0.5)]"
            style={{
              left: `calc(${(activeIndex + 0.5) * 20}% - 16px)`,
            }}
          />

          {navItems.map((item, idx) => {
            const isActive = activeIndex === idx;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-500/15 text-cyan-400 shadow-xs'
                      : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`font-sans text-[10px] leading-none tracking-tight font-medium ${
                    isActive ? 'font-bold text-white' : 'text-slate-400'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* =========================================================================
          DESKTOP LEFT SIDEBAR (>= 1024px)
          ========================================================================= */}
      <aside className="hidden lg:flex fixed top-[60px] left-0 bottom-0 w-[240px] z-20 border-r border-white/[0.08] bg-[#0D0F18]/80 backdrop-blur-2xl flex-col p-4 space-y-2">
        <div className="font-mono text-[10px] tracking-wider uppercase text-slate-400 px-3 py-2 font-bold">
          XPEDITION PLATFORM
        </div>
        {navItems.map((item, idx) => {
          const isActive = activeIndex === idx;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`h-11 px-3.5 rounded-xl flex items-center gap-3 font-sans text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/15 text-white font-semibold border border-indigo-500/30 shadow-[0_4px_16px_-4px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </aside>
    </>
  );
};

export default TabBar;
