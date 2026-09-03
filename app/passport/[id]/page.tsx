'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck, CheckCircle2, Award, Sparkles, Brain, Check } from 'lucide-react';

export default function PublicPassportPage({ params }: { params: { id: string } }) {
  const verifiedSkills = [
    { name: 'Core Foundations & Syntax', category: 'Fundamentals', masteryPercent: 85, status: 'Mastered' },
    { name: 'Data Structures & Trees', category: 'Algorithms', masteryPercent: 70, status: 'Proficient' },
    { name: 'System Modeling & DB', category: 'Architecture', masteryPercent: 65, status: 'Proficient' },
    { name: 'Neural Networks & AI Basics', category: 'Applied ML', masteryPercent: 60, status: 'Practiced' },
  ];

  const overallMastery = 70;

  return (
    <div className="min-h-screen bg-[#070414] text-white p-4 sm:p-8 select-none font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center font-mono font-bold text-sm text-[#00F0FF]">
              XP
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg text-white">
                Verified Skill Passport
              </h1>
              <p className="font-mono text-[10px] text-[#00F0FF] uppercase tracking-wider">
                CRYPTOGRAPHIC CREDENTIAL &middot; ID: {params.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/40 text-[#00FF87] font-mono text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>AUTHENTICATED</span>
          </div>
        </div>

        {/* Verified Concept Mastery Card */}
        <div className="p-5 rounded-2xl bg-[#120E24] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400 uppercase font-bold tracking-wider">
              Verified Concept Competencies
            </span>
            <span className="font-mono text-xs font-bold text-[#00F0FF]">
              {overallMastery}% Average Mastery
            </span>
          </div>

          <div className="space-y-2.5">
            {verifiedSkills.map((skill) => (
              <div
                key={skill.name}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-xs text-white truncate">
                      {skill.name}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-cyan-300">
                      {skill.masteryPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      style={{ width: `${skill.masteryPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metacognitive & Verification Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#120E22]/90 border border-white/10 space-y-1">
            <span className="font-mono text-[10px] uppercase text-slate-400 font-bold">CALIBRATION VERDICT</span>
            <p className="font-sans font-bold text-sm text-white">Knows what they know (&plusmn;5% accuracy)</p>
            <p className="font-sans text-xs text-slate-400">High metacognitive precision without overconfidence.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#120E22]/90 border border-white/10 space-y-1">
            <span className="font-mono text-[10px] uppercase text-slate-400 font-bold">SOLO VERIFICATION</span>
            <p className="font-sans font-bold text-sm text-white">Zero-Assistance Assessments</p>
            <p className="font-sans text-xs text-slate-400">Backed by authenticated weekly solo testing sessions.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex h-11 px-8 rounded-xl bg-signature-gradient text-white font-mono font-bold text-xs items-center justify-center gap-2 hover:brightness-110 shadow-xl transition-all"
          >
            <span>Start Your Learning Journey on XPedition &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
