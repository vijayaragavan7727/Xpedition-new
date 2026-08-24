'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicPassportPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-ink text-text flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-[#150F2A] border border-line rounded-[18px] p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-signature-gradient p-0.5 mx-auto">
          <div className="w-full h-full rounded-full bg-panel flex items-center justify-center font-mono text-xl font-bold">
            XP
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="font-orbitron font-bold text-xl uppercase text-gradient">PUBLIC SKILL PASSPORT</h1>
          <p className="font-mono text-xs text-muted">ID: {params.id}</p>
        </div>

        <p className="font-sans text-xs text-muted">
          Verified skill credentials and cryptographic mastery record for public passport identifier {params.id}.
        </p>

        <Link
          href="/home"
          className="inline-flex h-10 px-6 rounded-[10px] bg-signature-gradient text-white font-sans font-medium text-xs items-center justify-center"
        >
          View Your Dashboard
        </Link>
      </div>
    </div>
  );
}
