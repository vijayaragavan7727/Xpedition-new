'use client';

/**
 * Xpedition AI Transparency Statement
 * Route: /ai-transparency
 */

import React from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal/legalConfig';
import { Cpu, ArrowLeft, Shield, AlertCircle, CheckCircle2, Lock, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function AiTransparencyPage() {
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
            AI TRANSPARENCY • v{LEGAL_CONFIG.policyVersion}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI Transparency & Architecture
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            How artificial intelligence is used, bounded, and audited in {LEGAL_CONFIG.productName}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            Xpedition is an AI-assisted learning platform designed to accelerate understanding through doing.
            We operate under a strict principle: <strong className="text-white">&quot;Deterministic Assessment, AI-Assisted Enrichment.&quot;</strong>
            This page provides clear transparency into our AI systems, capabilities, boundaries, and student safety safeguards.
          </p>
        </div>

        {/* Core Sections */}
        <div className="space-y-6 text-sm text-slate-300">
          {/* Section 1: What Xira Does */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20 space-y-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">1. The Role of Xira (Educational Companion)</h2>
            </div>
            <p className="leading-relaxed text-xs">
              Xira is our interactive pedagogical agent. Xira helps students by:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
              <li>Providing on-demand conceptual hints during 3D experiments and visual challenges.</li>
              <li>Synthesizing intuitive analogies tailored to student interests (e.g. explaining voltage like water pressure).</li>
              <li>Breaking down complex textbook excerpts into conversational, step-by-step observations.</li>
              <li>Summarizing session accomplishments and offering encouraging feedback.</li>
            </ul>
          </section>

          {/* Section 2: What AI Does NOT Control (The Non-Negotiable Boundary) */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-amber-500/20 space-y-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Shield className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">2. What AI Does NOT Control</h2>
            </div>
            <p className="leading-relaxed text-xs">
              To ensure academic integrity, student evaluations, and grading safety, <strong className="text-white">AI is strictly prohibited from having unconstrained authority</strong> over core pedagogical state:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                <span className="text-xs font-mono font-bold text-amber-300">Mastery (BKT)</span>
                <p className="text-[11px] text-slate-400">
                  Concept mastery is calculated strictly via mathematical Bayesian Knowledge Tracing. An LLM cannot arbitrarily declare a student &quot;mastered&quot; or &quot;failed&quot;.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                <span className="text-xs font-mono font-bold text-amber-300">Adaptive Quest Routing</span>
                <p className="text-[11px] text-slate-400">
                  Next quest recommendations are resolved deterministically by the Decision Engine based on verified performance evidence.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                <span className="text-xs font-mono font-bold text-amber-300">Assessment Truth</span>
                <p className="text-[11px] text-slate-400">
                  Multiple-choice challenges and simulation verification are evaluated using deterministic answer keys and physical simulation metrics.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                <span className="text-xs font-mono font-bold text-amber-300">Teaching Mode Selection</span>
                <p className="text-[11px] text-slate-400">
                  The visual mode (3D, motion visual, interactive, exploded, transformation, 2D) is determined by deterministic pedagogical rules.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Third-Party Providers */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-indigo-400">
              <Cpu className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">3. Third-Party AI Providers & Capability Routing</h2>
            </div>
            <p className="leading-relaxed text-xs">
              Depending on the task and server configuration, requests may be processed by different specialized capability providers:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
              <li><strong className="text-white">Groq:</strong> Ultra-low-latency open-weight language models for rapid tutor explanations and misconception diagnoses.</li>
              <li><strong className="text-white">Tavily:</strong> Search and factual retrieval engine used for finding verified scientific citations and sources.</li>
              <li><strong className="text-white">FreeLLMAPI:</strong> Optional community gateway utilized as a zero-cost server-side fallback.</li>
              <li><strong className="text-white">OpenAI / Google Gemini:</strong> Optional secondary fallback models configured for complex qualitative evaluations.</li>
            </ul>
            <p className="text-xs text-slate-400 pt-1">
              All provider calls originate server-side. No API keys or vendor credentials are ever transmitted to or stored in student browsers.
            </p>
          </section>

          {/* Section 4: AI Limitations & Safety Tips */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">4. AI Limitations & Advice for Students</h2>
            </div>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
              <li><strong className="text-white">Verify Critical Information:</strong> While Xira is grounded in textbook sources, AI models can make errors. Always cross-check important formulas with official textbook sources.</li>
              <li><strong className="text-white">Avoid Submitting Sensitive Data:</strong> Never submit passwords, credit card numbers, home addresses, or private sensitive personal information into chat prompts.</li>
              <li><strong className="text-white">Zero Vendor Training:</strong> We configure enterprise API tiers to request that student learning interactions are not used to train public foundation models.</li>
            </ul>
          </section>
          {/* Contact / Inquiries */}
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
            <h2 className="text-base font-bold text-white">5. Inquiries & Feedback</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              If you have questions about our AI safety measures or wish to report an unexpected AI explanation, please contact our team at{' '}
              <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-cyan-400 hover:underline font-mono">
                {LEGAL_CONFIG.supportEmail}
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
          <span>{LEGAL_CONFIG.productName} AI Governance</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link href="/sources" className="hover:text-cyan-400 transition-colors">Sources & Licensing</Link>
            <Link href="/trust" className="hover:text-cyan-400 transition-colors">Trust Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
