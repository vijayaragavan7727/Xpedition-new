'use client';

/**
 * Public Skill Passport route.
 *
 * Xpedition does not publish Passports: there is no issuer, signature or
 * verification service, and no publish flow writes `passport_snapshots`.
 * This page therefore NEVER renders learner data. Previously it rendered
 * hardcoded skills and a "cryptographic credential" label for any id.
 */

import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { PASSPORT_PUBLIC_UNAVAILABLE, PASSPORT_TITLE } from '@/lib/passport/trustLanguage';

export default function PublicPassportPage() {
  return (
    <div
      data-testid="public-passport-unavailable"
      className="min-h-screen bg-[#070414] text-white p-4 sm:p-8 select-none font-sans flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="mx-auto w-10 h-10 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/60 flex items-center justify-center font-mono font-bold text-sm text-[#00F0FF]">
          XP
        </div>
        <h1 className="font-sans font-bold text-lg">{PASSPORT_TITLE}</h1>
        <p className="font-sans text-sm text-slate-300 leading-relaxed">{PASSPORT_PUBLIC_UNAVAILABLE}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold"
        >
          <Compass className="w-4 h-4" /> Go to Xpedition
        </Link>
      </div>
    </div>
  );
}
