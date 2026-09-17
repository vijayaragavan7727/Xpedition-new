'use client';

/**
 * Xpedition Terms of Service
 * Route: /terms
 */

import React from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal/legalConfig';
import { Shield, ArrowLeft, CheckCircle2, AlertTriangle, BookOpen, Scale, Mail, FileText, Ban } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 sm:p-8 font-sans flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8 py-6">
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
            LEGAL & TERMS • v{LEGAL_CONFIG.policyVersion}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Version {LEGAL_CONFIG.policyVersion} • Effective {LEGAL_CONFIG.effectiveDate} • Last Updated: {LEGAL_CONFIG.lastUpdated}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            Welcome to {LEGAL_CONFIG.productName}. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our educational
            software platform, simulations, laboratories, and AI-assisted learning features. By accessing or using the platform,
            you agree to be bound by these Terms.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm text-slate-300">
          {/* 1. Educational Purpose */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">1. Educational Purpose & Core Mission</h2>
            </div>
            <p className="leading-relaxed text-xs">
              {LEGAL_CONFIG.productName} is an interactive learning platform designed around the principle &quot;Learn by Doing. Not by Watching.&quot;
              All simulations, 3D visualizers, practice quests, and pedagogical assessments are provided solely for educational, self-study, and
              academic exploration purposes.
            </p>
          </section>

          {/* 2. Account Responsibility */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">2. User Accounts & Registration</h2>
            </div>
            <p className="leading-relaxed text-xs">
              When creating an account, you agree to provide accurate registration information and keep your credentials secure. You are
              responsible for all activities occurring under your account. If you discover unauthorized access to your account, you must
              notify us immediately at {LEGAL_CONFIG.supportEmail}.
            </p>
          </section>

          {/* 3. AI-Generated Content & Pedagogical Disclaimers */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">3. AI-Generated Explanations & Limitations</h2>
            </div>
            <p className="leading-relaxed text-xs">
              Our interactive companion (Xira) utilizes artificial intelligence to synthesize analogies, contextual hints, and explanations:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
              <li>AI-generated responses can occasionally contain inaccuracies or incomplete reasoning.</li>
              <li>Official grades, accredited academic credentials, and high-stakes scientific or legal determinations should not be based solely on automated conversational responses.</li>
              <li>Authoritative curriculum decisions and mastery probabilities on Xpedition are governed by verified deterministic algorithms and validated open educational resources.</li>
            </ul>
          </section>

          {/* 4. Acceptable Use & Prohibited Conduct */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Ban className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">4. Acceptable Use Policy</h2>
            </div>
            <p className="leading-relaxed text-xs">
              You agree not to engage in any prohibited conduct, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
              <li>Attempting to bypass platform security, access controls, or rate limits.</li>
              <li>Injecting malicious code, automated bots, or scrapers into the interactive canvas.</li>
              <li>Submitting unauthorized personal identification information (PII) of minors or third parties in open text prompts.</li>
              <li>Attempting prompt injection, adversarial extraction of server credentials, or reverse-engineering protected engine assets.</li>
            </ul>
          </section>

          {/* 5. Intellectual Property & Open Educational Resources */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <Scale className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">5. Intellectual Property & OER Attribution</h2>
            </div>
            <p className="leading-relaxed text-xs">
              The {LEGAL_CONFIG.productName} interface, visual teaching engine, and software architecture are protected by applicable intellectual property rights.
              Open educational materials (from OpenStax, MIT OpenCourseWare, PhET, and NASA) are attributed in accordance with their respective Creative Commons
              and open licenses. For detailed license statements, please review our <Link href="/sources" className="text-cyan-400 underline">Sources & Licensing</Link> directory.
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">6. Warranty Disclaimer & Limitation of Liability</h2>
            </div>
            <p className="leading-relaxed text-xs">
              {LEGAL_CONFIG.productName} is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied.
              To the maximum extent permitted by law, {LEGAL_CONFIG.legalEntityPlaceholder} disclaims all liability for any indirect, incidental, or consequential damages
              arising out of your use of or inability to use the learning platform.
            </p>
          </section>

          {/* 7. Contact */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Mail className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">7. Inquiries & Support</h2>
            </div>
            <p className="leading-relaxed text-xs">
              For any questions regarding these Terms, please reach out to:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 font-mono text-xs text-cyan-300">
              Email: {LEGAL_CONFIG.supportEmail}
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
          <span>{LEGAL_CONFIG.productName} Terms & Conditions</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link href="/disclaimer" className="hover:text-cyan-400 transition-colors">Disclaimer</Link>
            <Link href="/trust" className="hover:text-cyan-400 transition-colors">Trust Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
