'use client';

import React from 'react';
import { Sparkles, HelpCircle, CheckCircle2, AlertTriangle, RefreshCw, FileText, ArrowRight } from 'lucide-react';
import XiraActionBar from './XiraActionBar';

export interface StructuredXiraResponse {
  rawText: string;
  explanation: string;
  keyIdea?: string;
  example?: string;
  checkQuestion?: string;
  groundedSource?: string;
  conceptId?: string;
  conceptName?: string;
}

export interface XiraResponseProps {
  response: StructuredXiraResponse | null;
  error?: string | null;
  onRetry?: () => void;
  onTriggerAction?: (actionType: 'harder' | 'explain' | 'quiz' | 'practice') => void;
  className?: string;
}

/**
 * Parses raw text from Xira into structured pedagogical sections if marked with headers/bullets,
 * or returns structured breakdown.
 */
export function parseXiraResponseText(text: string, conceptName?: string, sourceName?: string): StructuredXiraResponse {
  const trimmed = text.trim();

  // Look for sections like "Key idea:", "Try this:", "Check:"
  let explanation = trimmed;
  let keyIdea: string | undefined;
  let example: string | undefined;
  let checkQuestion: string | undefined;

  const keyIdeaMatch = trimmed.match(/(?:Key idea|Key takeaway|Core idea):\s*([^.\n]+(?:\.[^.\n]+)?)/i);
  if (keyIdeaMatch) {
    keyIdea = keyIdeaMatch[1].trim();
  }

  const exampleMatch = trimmed.match(/(?:Try this|Example|For instance):\s*([^?\n]+(?:\?[^?\n]+)?)/i);
  if (exampleMatch) {
    example = exampleMatch[1].trim();
  }

  const checkMatch = trimmed.match(/(?:Check|Question|Active question|Check question):\s*([^?\n]+\?)/i);
  if (checkMatch) {
    checkQuestion = checkMatch[1].trim();
  } else {
    // If text ends with a question mark, treat the last sentence as the active check question
    const sentences = trimmed.split(/(?<=[.?!])\s+/);
    const lastSentence = sentences[sentences.length - 1];
    if (lastSentence && lastSentence.endsWith('?') && sentences.length > 1) {
      checkQuestion = lastSentence;
      explanation = sentences.slice(0, -1).join(' ');
    }
  }

  return {
    rawText: trimmed,
    explanation,
    keyIdea,
    example,
    checkQuestion,
    groundedSource: sourceName,
    conceptName,
  };
}

export const XiraResponse: React.FC<XiraResponseProps> = ({
  response,
  error,
  onRetry,
  onTriggerAction,
  className = '',
}) => {
  // Error state
  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-slate-200 space-y-3 ${className}`}
      >
        <div className="flex items-center gap-2 text-rose-300 font-sans font-semibold text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Xira couldn&apos;t respond right now</span>
        </div>

        <p className="font-sans text-xs text-slate-300">
          {error || 'A temporary connection issue occurred. Your learning progress is safe.'}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-sans text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          )}

          <a
            href="/class/projectile_motion"
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 font-sans text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          >
            <span>Continue Class</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (!response) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Xira Study Response"
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#141B33]/90 to-[#0F1426]/90 border border-indigo-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.35)] space-y-3.5 backdrop-blur-md transition-all ${className}`}
    >
      {/* Header: Source Grounding Tag & Concept */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/35 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans font-bold text-xs uppercase tracking-wider text-indigo-200">
            Xira Study Guidance
          </span>
        </div>

        {response.groundedSource ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
            <FileText className="w-3 h-3" />
            <span>From your material: {response.groundedSource}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Curriculum-backed explanation</span>
          </span>
        )}
      </div>

      {/* 1. Concise Pedagogical Explanation */}
      <div className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
        <p>{response.explanation}</p>
      </div>

      {/* 2. Key Idea Box */}
      {response.keyIdea && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-1">
          <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-indigo-300 block">
            Key Idea
          </span>
          <p className="font-sans text-xs text-slate-200 leading-relaxed font-medium">
            {response.keyIdea}
          </p>
        </div>
      )}

      {/* 3. Small Example / Try this */}
      {response.example && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-amber-300 block">
            Try This
          </span>
          <p className="font-sans text-xs text-slate-200 leading-relaxed">
            {response.example}
          </p>
        </div>
      )}

      {/* 4. Active Check Question */}
      {response.checkQuestion && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-300 font-sans font-semibold text-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quick Check</span>
          </div>
          <p className="font-sans text-xs text-slate-200 leading-relaxed font-medium">
            {response.checkQuestion}
          </p>
        </div>
      )}

      {/* 5. Action Bar (Direct Learning Actions) */}
      <div className="pt-2 border-t border-white/[0.06]">
        <XiraActionBar
          conceptId={response.conceptId || 'projectile_motion'}
          conceptName={response.conceptName}
          onTriggerAction={onTriggerAction}
        />
      </div>
    </div>
  );
};

export default XiraResponse;
