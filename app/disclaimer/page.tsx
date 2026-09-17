'use client';

/**
 * Xpedition Educational Disclaimer
 * Route: /disclaimer
 */

import React from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal/legalConfig';
import { AlertTriangle, ArrowLeft, Shield, CheckCircle2, BookOpen, Stethoscope, Scale } from 'lucide-react';

export default function EducationalDisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 sm:p-8 font-sans flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-8 py-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/trust"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Trust Center</span>
          </Link>
          <span className="font-mono text-[10px] uppercase text-cyan-400 font-bold tracking-widest">
            DISCLAIMER • v{LEGAL_CONFIG.policyVersion}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Educational Disclaimer
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Last Updated: {LEGAL_CONFIG.lastUpdated}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            Please read this disclaimer carefully before using {LEGAL_CONFIG.productName}.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-5 text-sm text-slate-300">
          {/* 1. Academic & Educational Purpose Only */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-cyan-400">
              <BookOpen className="w-5 h-5" />
              <h2 className="font-bold text-white text-base">1. Educational & Self-Study Purpose Only</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All content on {LEGAL_CONFIG.productName}—including 3D interactive laboratories, motion sequences, scientific formulas,
              problem-solving quests, and AI explanations—is published strictly for educational, conceptual exploration, and supplementary
              self-study purposes.
            </p>
          </div>

          {/* 2. No Professional Advice */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/30 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <Stethoscope className="w-5 h-5" />
              <h2 className="font-bold text-white text-base">2. Not Professional Medical, Engineering, or Legal Advice</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              While our models simulate scientific concepts (such as human heart anatomy, DC electric motors, and projectile kinematics):
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
              <li><strong className="text-white">Medical Content:</strong> Visualizations of cardiac blood flow or biology are for conceptual education and must not be used for medical diagnosis, treatment planning, or clinical decisions.</li>
              <li><strong className="text-white">Engineering Content:</strong> Simulated circuits, motors, and mechanical forces are idealized computational models and should not replace professional engineering standards or safety protocols.</li>
              <li><strong className="text-white">Legal & Financial Content:</strong> Economic diagrams (such as supply and demand) are educational models, not professional investment or legal counsel.</li>
            </ul>
          </div>

          {/* 3. AI Limitations & Independent Verification */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-indigo-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-bold text-white text-base">3. Verification of High-Stakes Information</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Although we ground our teaching plans in reputable open textbooks and peer-reviewed OER repositories, artificial intelligence
              can synthesize imperfect analogies or erroneous details. Students preparing for certified standardized examinations should
              cross-verify critical formulas and answers against official accredited course syllabi.
            </p>
          </div>

          {/* Contact Inquiries */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400">
            For academic questions, curriculum inquiries, or pedagogical feedback, contact{' '}
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-cyan-400 hover:underline font-mono">
              {LEGAL_CONFIG.supportEmail}
            </a>
            .
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
          <span>{LEGAL_CONFIG.productName} Educational Trust</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link href="/trust" className="hover:text-cyan-400 transition-colors">Trust Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
