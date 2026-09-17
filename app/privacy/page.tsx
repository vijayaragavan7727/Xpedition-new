'use client';

/**
 * Xpedition Privacy Policy
 * Route: /privacy
 */

import React from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal/legalConfig';
import { Shield, ArrowLeft, Lock, CheckCircle2, AlertCircle, Database, Cpu, Eye, Mail, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            LEGAL & PRIVACY • v{LEGAL_CONFIG.policyVersion}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Version {LEGAL_CONFIG.policyVersion} • Effective {LEGAL_CONFIG.effectiveDate} • Last Updated: {LEGAL_CONFIG.lastUpdated}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            At {LEGAL_CONFIG.productName}, we believe learning should be transparent, learner-driven, and focused on mastery.
            This policy outlines precisely what data we collect, how it powers your adaptive learning loop, where it is stored,
            and how you maintain complete control over your educational record.
          </p>
        </div>

        {/* Core Sections */}
        <div className="space-y-6 text-sm text-slate-300">
          {/* Section 1 */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Database className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
            </div>
            <p className="leading-relaxed">
              We practice data minimization. We only store information essential to delivering interactive, adaptive education:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-xs text-slate-300">
              <li>
                <strong className="text-white">Account Information:</strong> If you sign up, we store your email address, display name, and chosen educational goals via secure Supabase authentication.
              </li>
              <li>
                <strong className="text-white">Learning Evidence & Attempts:</strong> Question responses, trial correctness, problem-solving latency, and self-reported confidence ratings.
              </li>
              <li>
                <strong className="text-white">Bayesian Knowledge Tracing (BKT) Mastery:</strong> Calibrated statistical mastery estimates per concept ($L, T, G, S$ parameters) used to calculate your learning progression.
              </li>
              <li>
                <strong className="text-white">Xira Pedagogical Memories:</strong> Salient pedagogical observations (e.g., recurring calculation confusion, preferred explanation depth) up to 50 items per user.
              </li>
              <li>
                <strong className="text-white">Technical Interaction Telemetry:</strong> Ephemeral simulation interactions (slider adjustments, stage progressions, camera rotations) processed during active learning sessions.
              </li>
              <li>
                <strong className="text-white">Uploaded Study Documents (Optional):</strong> If you choose to use Document-Grounded QA, document text is parsed into temporary chunks to answer your questions.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">2. How We Use Your Information</h2>
            </div>
            <p className="leading-relaxed">
              Your information is used strictly to power your personalized learning journey:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-xs text-slate-300">
              <li>Sequencing appropriate concepts matching your active learning boundary.</li>
              <li>Diagnosing conceptual misconceptions and presenting alternative visual representations (3D, motion, interactive, exploded view, or 2D diagrams).</li>
              <li>Scheduling decay-prevention reviews before concepts fade from memory.</li>
              <li>We <strong className="text-white">never sell your personal data</strong> or use student learning data for behavioral ad targeting.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Cpu className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">3. Artificial Intelligence & Third-Party Processing</h2>
            </div>
            <p className="leading-relaxed">
              Xpedition features Xira, an AI educational companion that generates contextual hints, analogies, and explanations:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-xs text-slate-300">
              <li>
                <strong className="text-white">Configured Providers:</strong> Depending on system routing and capability availability, prompts may be processed by Groq, Tavily (search retrieval), OpenAI, or Google Gemini.
              </li>
              <li>
                <strong className="text-white">Deterministic Authority:</strong> AI does not control your mastery status, exam evaluations, or quest routing; those are calculated by deterministic algorithms.
              </li>
              <li>
                <strong className="text-white">Security:</strong> External providers receive only the specific academic concept, relevant textbook excerpts, and student query. All API keys remain isolated on the server.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Lock className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">4. Cookies & Browser Storage</h2>
            </div>
            <p className="leading-relaxed">
              Xpedition does not use non-essential advertising or tracking cookies:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-xs text-slate-300">
              <li>
                <strong className="text-white">Authentication Cookies:</strong> Strictly necessary HTTP-only session tokens managed by Supabase to verify your login state.
              </li>
              <li>
                <strong className="text-white">Local Storage:</strong> Scoped exclusively to your user ID (`xpedition_user_state_*`) to cache offline state and fast-launch experiences.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <Shield className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">5. Data Retention & Your Rights</h2>
            </div>
            <p className="leading-relaxed">
              You own your educational data. You have the right to inspect, export, or erase your learning history at any time:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-xs text-slate-300">
              <li>
                <strong className="text-white">Data Export:</strong> You can download a complete JSON export of your profile, masteries, attempts, and memories via your Profile settings or our export endpoint.
              </li>
              <li>
                <strong className="text-white">Account Deletion:</strong> You can request immediate erasure of your profile and historical attempts via the Profile Privacy controls.
              </li>
              <li>
                <strong className="text-white">Guest Mode:</strong> Visiting `/teach` without logging in stores zero cloud account data.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Mail className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">6. Contact Us</h2>
            </div>
            <p className="leading-relaxed text-xs">
              If you have any questions regarding this Privacy Policy or wish to exercise your data rights, please contact our support desk:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 font-mono text-xs text-cyan-300">
              Email: {LEGAL_CONFIG.supportEmail}
            </div>
          </section>
        </div>

        {/* Footer link back to Trust Center */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
          <span>{LEGAL_CONFIG.productName} Trust & Compliance</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <Link href="/ai-transparency" className="hover:text-cyan-400 transition-colors">AI Transparency</Link>
            <Link href="/trust" className="hover:text-cyan-400 transition-colors">Trust Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
