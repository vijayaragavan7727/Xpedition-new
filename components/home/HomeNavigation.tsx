'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Globe, Award, User } from 'lucide-react';
import { XpeditionLogo } from '@/components/XpeditionLogo';

export interface NavItem {
  label: string;
  mobileLabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefixes?: string[];
}

export const HOME_PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/home', icon: Home, matchPrefixes: ['/home'] },
  { label: 'Learn / Class', mobileLabel: 'Learn', href: '/learn', icon: BookOpen, matchPrefixes: ['/class', '/learn', '/tutor'] },
  { label: 'World', href: '/world', icon: Globe, matchPrefixes: ['/world'] },
  { label: 'Passports', href: '/passport', icon: Award, matchPrefixes: ['/passport'] },
  { label: 'Profile', href: '/profile', icon: User, matchPrefixes: ['/profile'] },
];

export const HomeDesktopSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col justify-between w-[210px] lg:w-[230px] shrink-0 border-r border-[#EBE7DF] bg-[#FAF8F5] min-h-screen sticky top-0 h-screen select-none z-30"
      aria-label="Desktop Primary Navigation"
    >
      {/* Top Section: Logo & 5 Navigation Links */}
      <div className="p-5 pt-6 space-y-6">
        {/* Brand Logo */}
        <div className="px-2">
          <Link
            href="/home"
            className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#184E38] rounded-lg"
          >
            <XpeditionLogo />
          </Link>
        </div>

        {/* 5 Primary Navigation Items */}
        <nav className="space-y-1.5 pt-2" aria-label="Main Navigation">
          {HOME_PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.matchPrefixes && item.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/')));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-sans text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#E3EBE5] text-[#184E38] shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-[#F0ECE1]'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#184E38]' : 'text-slate-600'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Environmental Decorative Illustration (Hot-air balloon + Village house) */}
      <div className="relative w-full h-[220px] overflow-hidden pointer-events-none mt-auto">
        {/* Hot-air balloon floating high */}
        <div className="absolute top-2 left-10 w-16 h-20 animate-pulse duration-[3000ms]">
          <Image
            src="/images/home/home-hot-air-balloon.png"
            alt=""
            width={64}
            height={80}
            className="object-contain drop-shadow-sm"
          />
        </div>

        {/* Village House & Mountain greenery at bottom */}
        <div className="absolute -bottom-2 left-0 right-0 h-44">
          <Image
            src="/images/home/home-village-house.png"
            alt=""
            fill
            sizes="230px"
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </aside>
  );
};

export const HomeMobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-[#EBE7DF] bg-[#FAF8F5]/98 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.03)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Mobile Primary Navigation"
    >
      <div className="h-[56px] sm:h-[62px] flex items-center justify-around px-2 max-w-lg mx-auto">
        {HOME_PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.matchPrefixes && item.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/')));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex-1 h-full min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-colors active:scale-95 ${
                isActive ? 'text-[#184E38]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div
                className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-[#E3EBE5] text-[#184E38]' : 'text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={`font-sans text-[10px] sm:text-[11px] leading-tight ${
                  isActive ? 'font-bold text-[#184E38]' : 'font-medium text-slate-600'
                }`}
              >
                {item.mobileLabel || item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
