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
import { ClassroomToolType } from './types';
import { AdaptiveDirective } from '@/lib/classroom/classroomIntelligence';

export interface ClassroomXiraAssistantProps {
  topicTitle: string;
  subject: string;
  currentStepTitle: string;
  stepHint?: string;
  activeMisconception?: string;
  hintsUsedCount?: number;
  adaptiveDirective?: AdaptiveDirective;
  onOpenTool?: (tool: ClassroomToolType) => void;
  onCloseMobileDrawer?: () => void;
  className?: string;
}

const QUICK_ACTIONS = [
  { id: 'why', label: 'Why?', icon: <HelpCircle className="w-3.5 h-3.5 text-sky-400" />, prompt: 'Why does this happen physically?' },
  { id: 'simpler', label: 'Explain simpler', icon: <BookOpen className="w-3.5 h-3.5 text-emerald-400" />, prompt: 'Explain this in the simplest possible terms.' },
  { id: 'example', label: 'Give an example', icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />, prompt: 'Give me an everyday real-world example of this.' },
  { id: 'hint', label: 'Give me a hint', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, prompt: 'Give me a hint without spoiling the answer.' },
  { id: 'deeper', label: 'Go deeper', icon: <Zap className="w-3.5 h-3.5 text-purple-400" />, prompt: 'What is the deeper mathematical or scientific mechanism here?' },
];

export const ClassroomXiraAssistant: React.FC<ClassroomXiraAssistantProps> = ({
  topicTitle,
  subject,
  currentStepTitle,
  stepHint,
  activeMisconception,
  hintsUsedCount = 0,
  adaptiveDirective,
  onOpenTool,
  onCloseMobileDrawer,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpandedChat, setIsExpandedChat] = useState(false);
  const [activeResponse, setActiveResponse] = useState<StructuredXiraResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAsk = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setIsExpandedChat(true);
    setErrorMessage(null);

    // Instant hint check
    if (trimmed.toLowerCase().includes('hint') && stepHint) {
      setTimeout(() => {
        setActiveResponse(
          parseXiraResponseText(
            `Here is a targeted hint for ${currentStepTitle}:\n\nKey idea: ${stepHint}\n\nTry this: Look closely at the Smart Board diagram to see how forces balance!`,
            topicTitle
          )
        );
        setIsLoading(false);
        setInputValue('');
      }, 250);
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context: {
            scope: 'classroom',
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
      const reply = data.reply || data.message || 'I observed your question. Let us analyze this step.';
      setActiveResponse(parseXiraResponseText(reply, topicTitle));
      setInputValue('');
    } catch (err: any) {
      console.warn('[ClassroomXiraAssistant] Fallback:', err.message);
      setActiveResponse(
        parseXiraResponseText(
          `Regarding "${trimmed}" in ${topicTitle}:\n\nKey idea: Every concept builds on physical cause and effect. Notice how current interacts with the magnetic flux.\n\nTry this: Observe the visual demonstration on the Smart Board to see the mechanism in action!`,
          topicTitle
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-3xl bg-[#090F24]/90 border border-indigo-500/25 shadow-2xl backdrop-blur-xl overflow-hidden select-none ${className}`}
      style={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
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
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Contextual Assistant</span>
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
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleAsk(action.prompt)}
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
};

export default ClassroomXiraAssistant;
