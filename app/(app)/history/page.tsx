'use client';

import React from 'react';
import Link from 'next/link';

export default function HistoryPage() {
  return (
    <div className="space-y-6 select-none pt-4">
      <div>
        <h1 className="font-sans font-semibold text-2xl text-text">Attempt History</h1>
        <p className="font-sans text-xs text-muted mt-1">
          Review your past quest attempts, accuracy, and concept progression logs.
        </p>
      </div>

      <div className="p-8 bg-[#150F2A] rounded-[16px] border border-line/40 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-raised flex items-center justify-center text-cyan mx-auto font-mono text-lg">
          ⏱
        </div>
        <div className="space-y-1">
          <h2 className="font-sans font-medium text-base text-text">No detailed logs recorded yet</h2>
          <p className="font-sans text-xs text-muted max-w-sm mx-auto">
            Complete your first adaptive quest on Home to log items and track accuracy over time.
          </p>
        </div>
        <Link
          href="/home"
          className="inline-flex h-10 px-5 rounded-[10px] bg-signature-gradient text-white font-sans font-medium text-xs items-center justify-center gap-2 hover:brightness-108 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
