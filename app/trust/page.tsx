'use client';

/**
 * Xpedition Trust Center
 * Route: /trust
 *
 * Centralized trust hub linking to Privacy, Terms, AI Transparency,
 * Educational Disclaimer, Source Attribution, and User Data Controls.
 */

import React from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal/legalConfig';
import {
  Shield,
  FileText,
  Cpu,
  AlertTriangle,
  BookOpen,
  UserCheck,
  Mail,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

export default function TrustCenterPage() {
  const trustCards = [
    {
      title: 'Privacy Policy',
      description: 'How we collect, store, and minimize your learning data, attempts, and memory records.',
      href: '/privacy',
      icon: Shield,
      badge: 'Data Minimization',
      color: 'text-cyan-400',
      border: 'hover:border-cyan-500/40',
    },
    {
      title: 'Terms of Service',
      description: 'Acceptable use, educational scope, content licensing, and platform agreements.',
      href: '/terms',
      icon: FileText,
      badge: 'Transparent Rules',
      color: 'text-indigo-400',
      border: 'hover:border-indigo-500/40',
    },
    {
      title: 'AI Transparency',
      description: 'Understanding Xira, provider boundaries, and why AI does not control your mastery.',
      href: '/ai-transparency',
      icon: Cpu,
      badge: 'Advisory AI Only',
      color: 'text-emerald-400',
      border: 'hover:border-emerald-500/40',
    },
    {
      title: 'Educational Disclaimer',
      description: 'Our commitment to self-directed learning and the limitations of automated explanations.',
      href: '/disclaimer',
      icon: AlertTriangle,
      badge: 'Self-Study Scope',
      color: 'text-amber-400',
      border: 'hover:border-amber-500/40',
    },
    {
      title: 'Learning Sources & Attribution',
      description: 'Directory of OpenStax, MIT OCW, PhET, and NASA OER foundations with license details.',
      href: '/sources',
      icon: BookOpen,
      badge: 'Verified OER',
      color: 'text-sky-400',
      border: 'hover:border-sky-500/40',
    },
    {
      title: 'User Data Controls',
      description: 'Export your learning journey, view stored BKT mastery records, or request full account deletion.',
      href: '/profile',
      icon: UserCheck,
      badge: 'Export & Deletion',
      color: 'text-purple-400',
      border: 'hover:border-purple-500/40',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 sm:p-8 font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-10 py-6">
        {/* Header / Brand */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                {LEGAL_CONFIG.productName} Trust Center
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Integrity, Transparency, and Student Data Protection
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 transition-colors"
            >
              Return to Platform
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Built for learning. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
              Grounded in transparency.
            </span>
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            At {LEGAL_CONFIG.productName}, we build interactive, gamified education where students learn by doing.
            We treat your privacy, pedagogical independence, and educational data with radical honesty and rigorous technical boundaries.
          </p>
        </div>

        {/* 4 Core Guarantees Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold font-mono uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>Data Minimization</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              No tracking cookies. No ad brokers. Only data required to evaluate mastery.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono uppercase">
              <Cpu className="w-3.5 h-3.5" />
              <span>Advisory AI</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Deterministic Bayesian Knowledge Tracing scores your learning, never generative AI.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold font-mono uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Verified OER</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Grounding in OpenStax, MIT, PhET, and NASA with explicit attribution.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold font-mono uppercase">
              <Database className="w-3.5 h-3.5" />
              <span>User Ownership</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Export your records anytime as JSON or permanently purge your account.
            </p>
          </div>
        </div>

        {/* Trust Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trustCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group p-6 rounded-2xl bg-slate-900/60 border border-white/10 transition-all duration-200 ${card.border} hover:bg-slate-900/90 flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <h2 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                      {card.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 group-hover:text-cyan-400 transition-colors pt-2 border-t border-white/5">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Contact / Inquiries Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Mail className="w-4 h-4" />
            <span>Questions or Security Inquiries?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If you have questions about our terms, privacy practices, source citations, or wish to report a security vulnerability, please contact our support team at{' '}
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-cyan-400 hover:underline font-mono">
              {LEGAL_CONFIG.supportEmail}
            </a>
            .
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Policy Version {LEGAL_CONFIG.policyVersion} • Last Updated: {LEGAL_CONFIG.lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
}
