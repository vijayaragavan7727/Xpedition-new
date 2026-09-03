'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Sparkles, Globe, TrendingUp } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/home', icon: Home, matchPrefixes: ['/home'] },
    { label: 'Learn', href: '/learn', icon: BookOpen, matchPrefixes: ['/learn', '/quest'] },
    { label: 'XIRA', href: '/xira', icon: Sparkles, matchPrefixes: ['/xira', '/tutor'] },
    { label: 'World', href: '/world', icon: Globe, matchPrefixes: ['/world'] },
    { label: 'Progress', href: '/progress', icon: TrendingUp, matchPrefixes: ['/progress', '/passport', '/history'] },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-white/[0.08] bg-[#0D0F18]/95 backdrop-blur-2xl select-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Bottom Navigation"
    >
      <div className="relative h-[60px] flex items-center justify-around px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.matchPrefixes && item.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/')));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`flex-1 h-full min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-indigo-500/20 text-cyan-300 shadow-xs' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`font-sans text-[10px] leading-none tracking-tight ${
                  isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
