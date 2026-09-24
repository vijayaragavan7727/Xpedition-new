'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Globe, Award, User } from 'lucide-react';

export interface TabItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefixes?: string[];
}

const navItems: TabItem[] = [
  { name: 'Home', href: '/home', icon: Home, matchPrefixes: ['/home'] },
  { name: 'Learn / Class', href: '/class', icon: BookOpen, matchPrefixes: ['/class', '/learn', '/tutor'] },
  { name: 'World', href: '/world', icon: Globe, matchPrefixes: ['/world'] },
  { name: 'Passports', href: '/passport', icon: Award, matchPrefixes: ['/passport'] },
  { name: 'Profile', href: '/profile', icon: User, matchPrefixes: ['/profile'] },
];

export const TabBar: React.FC = () => {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const idx = navItems.findIndex((item) => {
      if (pathname === item.href) return true;
      if (item.matchPrefixes) {
        return item.matchPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
      }
      return item.href !== '/home' && pathname.startsWith(item.href);
    });

    if (idx !== -1) {
      setActiveIndex(idx);
    }
  }, [pathname]);

  return (
    <>
      {/* =========================================================================
          MOBILE BOTTOM TAB BAR (< 1024px) - Clean 5-Destination Bar
          ========================================================================= */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-[#263130] bg-[#080B0D]/95 backdrop-blur-2xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Primary Navigation"
      >
        <div className="relative h-[60px] flex items-center justify-around px-1 max-w-lg mx-auto">
          {/* Active indicator bar */}
          <div
            className="absolute top-0 h-[2px] w-8 bg-[#0B7066] rounded-b-full transition-all duration-200 ease-out"
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
                aria-label={item.name}
                className={`flex-1 h-full min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                  isActive ? 'text-white' : 'text-[#8E9693] hover:text-white'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#004741] text-white border border-[#17655E]'
                      : 'text-[#8E9693]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`font-sans text-[10px] leading-none tracking-tight ${
                    isActive ? 'font-bold text-white' : 'font-medium text-[#8E9693]'
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
      <aside className="hidden lg:flex fixed top-[56px] left-0 bottom-0 w-[240px] z-20 border-r border-[#263130] bg-[#080B0D]/95 backdrop-blur-2xl flex-col p-4 space-y-2">
        <div className="font-mono text-[10px] tracking-wider uppercase text-[#8E9693] px-3 py-2 font-bold">
          XPEDITION
        </div>
        {navItems.map((item, idx) => {
          const isActive = activeIndex === idx;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.name}
              className={`h-11 px-3.5 rounded-[10px] flex items-center gap-3 font-sans text-sm transition-colors ${
                isActive
                  ? 'bg-[#004741] text-white font-semibold border border-[#17655E]'
                  : 'text-[#8E9693] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#8E9693]'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </aside>
    </>
  );
};

export default TabBar;
