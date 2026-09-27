'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  HelpCircle,
  Lightbulb,
  X,
  ChevronRight,
  BookOpen,
  Zap,
} from 'lucide-react';
import { XiraResponse, parseXiraResponseText, StructuredXiraResponse } from '@/components/xira/XiraResponse';
import { ClassroomToolType, XiraLessonPrompts } from './types';
import { AdaptiveDirective } from '@/lib/classroom/classroomIntelligence';
import type { XiraClassContext, XiraObservation } from '@/lib/classroom/classRuntime';

export interface ClassroomXiraAssistantProps {
  /** Active lesson context. Xira never answers about any other concept. */
  context: XiraClassContext;
  /** Lesson-owned quick prompts. */
  prompts?: XiraLessonPrompts;
  activeMisconception?: string;
  hintsUsedCount?: number;
  adaptiveDirective?: AdaptiveDirective;
  /** Observation computed from this class's real evidence (lib/classroom/classRuntime.ts). */
  observation?: XiraObservation | null;
  onObservationAction?: (action: { kind: 'hint' | 'reveal_answer' | 'revisit'; stepIndex?: number }) => void;
  onOpenTool?: (tool: ClassroomToolType) => void;
  onCloseMobileDrawer?: () => void;
  className?: string;
}

/**
 * Quick actions are built from the ACTIVE lesson's prompts. If a lesson has no
 * prompts, neutral prompts are generated from its own title — never a
 * subject-specific default borrowed from another concept.
 */
export function buildXiraQuickActions(context: XiraClassContext, prompts?: XiraLessonPrompts) {
  const p: XiraLessonPrompts = prompts ?? {
    why: `Why is this true for ${context.topicTitle}?`,
    simpler: `Explain ${context.stepTitle} in the simplest possible terms.`,
    example: `Give me a real-world example of ${context.topicTitle}.`,
    hint: `Give me a hint for ${context.stepTitle} without spoiling the answer.`,
    deeper: `What is the deeper idea behind ${context.topicTitle}?`,
  };
  return [
    { id: 'why', label: 'Why?', icon: <HelpCircle className="w-3.5 h-3.5 text-sky-400" />, prompt: p.why },
    { id: 'simpler', label: 'Explain simpler', icon: <BookOpen className="w-3.5 h-3.5 text-emerald-400" />, prompt: p.simpler },
    { id: 'example', label: 'Give an example', icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />, prompt: p.example },
    { id: 'hint', label: 'Give me a hint', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, prompt: p.hint },
    { id: 'deeper', label: 'Go deeper', icon: <Zap className="w-3.5 h-3.5 text-purple-400" />, prompt: p.deeper },
  ];
}

/** Offline fallback answer built only from the active step. */
export function buildXiraOfflineAnswer(context: XiraClassContext, question: string): string {
  const lines = [
    `Regarding "${question}" in ${context.topicTitle} (${context.stepTitle}):`,
    '',
    `Key idea: ${context.keyIdea}`,
  ];
  if (context.tryThis) lines.push('', `Try this: ${context.tryThis}`);
  return lines.join('\n');
}

export const ClassroomXiraAssistant: React.FC<ClassroomXiraAssistantProps> = React.memo(({
  context,
  prompts,
  activeMisconception,
  hintsUsedCount = 0,
  adaptiveDirective,
  observation,
  onObservationAction,
  onOpenTool,
  onCloseMobileDrawer,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpandedChat, setIsExpandedChat] = useState(false);
  const [activeResponse, setActiveResponse] = useState<StructuredXiraResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { topicTitle, stepTitle: currentStepTitle, hint: stepHint, conceptId } = context;
  const quickActions = React.useMemo(() => buildXiraQuickActions(context, prompts), [context, prompts]);

  // Stale-response guard: an answer for a previous concept/step is discarded.
  const activeKeyRef = React.useRef(`${conceptId}:${context.stepId}`);
  React.useEffect(() => {
    activeKeyRef.current = `${conceptId}:${context.stepId}`;
    setActiveResponse(null);
    setErrorMessage(null);
  }, [conceptId, context.stepId]);

  const handleAsk = React.useCallback(async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setIsExpandedChat(true);
    setErrorMessage(null);

    // Instant hint check
    if (trimmed.toLowerCase().includes('hint') && stepHint) {
      setTimeout(() => {
        setActiveResponse(
          {
            ...parseXiraResponseText(`Here is a targeted hint for ${currentStepTitle}:\n\nKey idea: ${stepHint}`, topicTitle),
            conceptId,
          }
        );
        setIsLoading(false);
        setInputValue('');
      }, 250);
      return;
    }

    const requestKey = activeKeyRef.current;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context: {
            scope: 'classroom',
            conceptId,
            concept: topicTitle,
            stepTitle: currentStepTitle,
            misconception: activeMisconception,
            hintsUsed: hintsUsedCount,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Xira response: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (activeKeyRef.current !== requestKey) return; // concept/step changed: drop stale answer
      const reply = data.reply || data.message || 'I observed your question. Let us analyze this step.';
      setActiveResponse({ ...parseXiraResponseText(reply, topicTitle), conceptId });
      setInputValue('');
    } catch (err: any) {
      console.warn('[ClassroomXiraAssistant] Fallback:', err.message);
      if (activeKeyRef.current !== requestKey) return;
      setActiveResponse({ ...parseXiraResponseText(buildXiraOfflineAnswer(context, trimmed), topicTitle), conceptId });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, stepHint, currentStepTitle, topicTitle, activeMisconception, hintsUsedCount, conceptId, context]);

  return (
    <div
      data-testid="xira-panel"
      data-concept-id={conceptId}
      className={`flex flex-col rounded-[22px] bg-[#0A1230]/85 border border-sky-400/25 shadow-2xl backdrop-blur-md overflow-hidden select-none ${className}`}
      style={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* =====================================================================
          1. COMPACT XIRA HEADER (MATCHING REFERENCE)
         ===================================================================== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {/* Glowing Xira Diamond Emblem */}
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans font-black text-xs tracking-wider text-white uppercase">
            XIRA
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Contextual Assistant Green Status Indicator */}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono text-emerald-400 font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Contextual<span className="hidden xl:inline"> Assistant</span></span>
          </span>

          {onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              aria-label="Close assistant"
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          2. ASSISTANT BODY
         ===================================================================== */}
      <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3">
        {/* Evidence-based observation: derived only from this learner's answers in this class. */}
        {observation && (
          <div
            data-testid="xira-observation"
            data-observation-kind={observation.kind}
            className={`p-3 rounded-2xl border space-y-1.5 ${
              observation.kind === 'on_track'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans font-bold text-xs">{observation.title}</span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">From your answers</span>
            </div>
            <p className="font-sans text-[11px] text-slate-200 leading-relaxed">{observation.message}</p>
            {observation.detail && (
              <p data-testid="xira-observation-detail" className="font-sans text-[11px] text-slate-300 leading-relaxed">
                {observation.detail}
              </p>
            )}
            {observation.revisit && observation.revisit.length > 0 && onObservationAction && (
              <div className="flex flex-col gap-1 pt-0.5">
                {observation.revisit.map((r, i) => (
                  <button
                    key={`${r.index}-${i}`}
                    type="button"
                    data-revisit-step={r.index}
                    onClick={() => onObservationAction({ kind: 'revisit', stepIndex: r.index })}
                    className="text-left text-[11px] font-mono text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    Revisit step {r.index + 1}: {r.title} →
                  </button>
                ))}
              </div>
            )}
            {observation.action && onObservationAction && (
              <button
                type="button"
                data-observation-action={observation.action.kind}
                onClick={() => onObservationAction({ kind: observation.action!.kind, stepIndex: observation.action!.stepIndex })}
                className="text-[11px] font-mono text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
              >
                {observation.action.label} →
              </button>
            )}
          </div>
        )}

        {/* Adaptive Remedial Callout if detected */}
        {adaptiveDirective && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-amber-200">
            <div className="flex items-center gap-1.5 font-sans font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{adaptiveDirective.smartBoardCallout?.title || 'Teacher Observation'}</span>
            </div>
            <p className="font-sans text-[11px] text-slate-200 leading-relaxed">
              {adaptiveDirective.smartBoardCallout?.message}
            </p>
            {onOpenTool && (
              <button
                type="button"
                onClick={() => onOpenTool('hint')}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 underline font-semibold"
              >
                {adaptiveDirective.smartBoardCallout?.actionLabel || 'Open Hint'} →
              </button>
            )}
          </div>
        )}

        {/* Ask Xira Trigger Button / Card */}
        <button
          type="button"
          onClick={() => setIsExpandedChat(!isExpandedChat)}
          className="w-full p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900/90 border border-indigo-500/35 hover:border-indigo-400/60 text-left flex items-center justify-between transition-all group shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-black text-xs text-white group-hover:text-indigo-200 transition-colors">
                Ask Xira
              </h3>
              <p className="font-sans text-[10px] text-slate-400">
                Get help with your current lesson
              </p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform ${isExpandedChat ? 'rotate-90' : ''}`} />
        </button>

        {/* Optional Expandable Custom Query Input */}
        {isExpandedChat && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(inputValue);
            }}
            className="p-2 rounded-xl bg-black/40 border border-indigo-500/30 flex items-center gap-1.5 animate-in fade-in duration-200"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] text-xs font-sans text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send question"
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Active Structured Response if expanded */}
        {activeResponse && (
          <div className="p-2.5 rounded-2xl bg-[#060B1E] border border-indigo-500/30 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] mb-1.5">
              <span className="font-mono text-[10px] text-indigo-300 font-bold uppercase">Explanation</span>
              <button
                type="button"
                onClick={() => setActiveResponse(null)}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300"
              >
                Close ✕
              </button>
            </div>
            <XiraResponse
              response={activeResponse}
              error={errorMessage}
              onRetry={() => handleAsk(inputValue || 'Explain this step')}
            />
          </div>
        )}

        {isLoading && (
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-indigo-300 text-[11px] font-mono animate-pulse">
            <Bot className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing lesson context...</span>
          </div>
        )}

        {/* Quick Action Pills (Exactly matching reference screen) */}
        <div className="space-y-1 pt-0.5">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleAsk(action.prompt)}
              title={action.prompt}
              data-xira-prompt={action.prompt}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/[0.12] text-left flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-sans text-slate-300 group-hover:text-white">
                {action.icon}
                <span className="font-medium text-[11px] sm:text-xs">{action.label}</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

ClassroomXiraAssistant.displayName = 'ClassroomXiraAssistant';

export default ClassroomXiraAssistant;

