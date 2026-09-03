'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { getStoreData, selectNextTarget, UserStoreData } from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { Card, Button, Badge } from '@/components/ui';
import {
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  ArrowRight,
  Bot,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Zap,
  RotateCcw,
  Compass,
  MessageSquare,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'xira';
  text: string;
  timestamp: number;
  conceptName?: string;
  conceptId?: string;
}

export default function XiraPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const data = getStoreData();
    setStoreData(data);
  }, []);

  const target = useMemo(() => (storeData ? selectNextTarget(storeData) : null), [storeData]);
  const goalTitle =
    storeData?.goalText ||
    (storeData?.concepts && storeData.concepts.length > 0
      ? 'Your Learning Journey'
      : 'Your Learning Path');
  const activeConceptName =
    target && target.conceptId !== 'default'
      ? target.conceptName
      : storeData?.concepts?.[0]?.name;
  const activeConceptId =
    target && target.conceptId !== 'default'
      ? target.conceptId
      : storeData?.concepts?.[0]?.id;

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading || !storeData) return;

    const userMsg: ChatMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const concepts = storeData.concepts || [];
      const fading = concepts.filter((c) => c.retentionRisk > 0.35);
      const activeConcept = concepts.find((c) => c.id === activeConceptId);
      const theta = activeConcept?.thetaSolo ?? -0.4;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context: {
            scope: activeConceptName ? 'tutor' : 'home',
            concept: activeConceptName || goalTitle,
            goal: goalTitle,
            theta,
            name: storeData.handle || 'Learner',
            concepts: concepts.map((c) => ({
              id: c.id,
              name: c.name,
              mastery: c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : (c.masteryPercentage || 0),
            })),
            fadingConcepts: fading.map((c) => c.name),
          },
        }),
      });

      const data = await res.json();
      const reply =
        data.reply ||
        "I'm here to support your learning! What would you like to explore next?";

      const xiraMsg: ChatMessage = {
        id: 'x_' + Date.now(),
        sender: 'xira',
        text: reply,
        timestamp: Date.now(),
        conceptName: activeConceptName,
        conceptId: activeConceptId,
      };

      setMessages((prev) => [...prev, xiraMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'xira',
          text: "I'm having a brief connection pause. Let's continue exploring your learning path!",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingId(id);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  };

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Connecting to XIRA...</span>
      </div>
    );
  }

  const quickActions = [
    {
      label: 'Explain this',
      prompt: activeConceptName
        ? `Explain ${activeConceptName} in a simple, clear way.`
        : 'Explain our current learning topic in simple terms.',
    },
    {
      label: 'Give me a hint',
      prompt: activeConceptName
        ? `Give me a conceptual hint for understanding ${activeConceptName}.`
        : 'Give me a helpful hint for my next study session.',
    },
    {
      label: 'Quiz me',
      prompt: activeConceptName
        ? `Ask me a quick multiple-choice question to test my knowledge of ${activeConceptName}.`
        : 'Ask me a quick question to test my understanding.',
    },
    {
      label: 'Simplify it',
      prompt: activeConceptName
        ? `Explain ${activeConceptName} as if I were a complete beginner with an easy analogy.`
        : 'Simplify the main ideas of my current topic.',
    },
    {
      label: 'Give me an example',
      prompt: activeConceptName
        ? `Give me a concrete real-world example of how ${activeConceptName} is used.`
        : "Give me a real-world example of what I'm learning.",
    },
    {
      label: 'Why does this matter?',
      prompt: activeConceptName
        ? `Why is learning ${activeConceptName} important in the big picture of ${goalTitle}?`
        : `Why is this topic important for ${goalTitle}?`,
    },
  ];

  const emptyStatePrompts = [
    {
      title: 'Explain my current topic',
      desc: activeConceptName
        ? `Break down ${activeConceptName} simply`
        : 'Break down core ideas',
      prompt: activeConceptName
        ? `Explain ${activeConceptName} in simple terms with an example.`
        : 'Explain my current topic in simple terms.',
      icon: BookOpen,
    },
    {
      title: 'Give me a simple analogy',
      desc: 'Understand the concept intuitively',
      prompt: activeConceptName
        ? `Give me an everyday analogy to understand ${activeConceptName}.`
        : "Give me an analogy to understand what I'm learning.",
      icon: Lightbulb,
    },
    {
      title: 'Test my understanding',
      desc: 'Get a quick practice question',
      prompt: activeConceptName
        ? `Quiz me on ${activeConceptName} with a quick question.`
        : 'Test my understanding with a quick question.',
      icon: Zap,
    },
    {
      title: "Help me when I'm stuck",
      desc: 'Troubleshoot common hurdles',
      prompt: activeConceptName
        ? `What are the most common beginner mistakes in ${activeConceptName} and how do I avoid them?`
        : 'What are common pitfalls and how do I avoid them?',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10 font-sans select-none flex flex-col min-h-[calc(100vh-8.5rem)]">
      {/* =========================================================================
          1. XIRA HEADER (Clean, Calm, Simple)
          ========================================================================= */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-white leading-tight">XIRA</h1>
            <p className="font-sans text-xs text-slate-400">Your learning companion</p>
          </div>
        </div>

        {activeConceptId && (
          <Link href={`/tutor/${activeConceptId}`} className="shrink-0">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Tutor Lesson
            </Button>
          </Link>
        )}
      </div>

      {/* =========================================================================
          2. CONTEXT CARD (Reliable Existing Data)
          ========================================================================= */}
      <Card variant="default" className="p-3.5 sm:p-4 border-white/[0.08] bg-[#0D0F18]/90 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 space-y-0.5">
            <div className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-cyan-400" />
              LEARNING {goalTitle.toUpperCase()}
            </div>
            {activeConceptName ? (
              <p className="font-sans text-xs sm:text-sm text-slate-200 truncate">
                Current focus: <span className="font-bold text-white">{activeConceptName}</span>
              </p>
            ) : (
              <p className="font-sans text-xs text-slate-400">
                Ask XIRA anything about your learning journey.
              </p>
            )}
          </div>

          {target && target.conceptId !== 'default' && (
            <Link href="/quest" className="shrink-0">
              <Badge
                variant="indigo"
                size="sm"
                className="cursor-pointer hover:bg-indigo-500/30 transition-colors py-1 px-2.5"
              >
                Start Quest →
              </Badge>
            </Link>
          )}
        </div>
      </Card>

      {/* =========================================================================
          3. QUICK ACTIONS (Compact, Mobile-Friendly Learner Prompts)
          ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleSendMessage(action.prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-cyan-400/40 hover:bg-white/[0.08] text-slate-300 hover:text-white whitespace-nowrap transition-all text-xs font-sans disabled:opacity-50 disabled:pointer-events-none"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          4. CHAT EXPERIENCE / DIALOGUE AREA
          ========================================================================= */}
      <Card
        variant="default"
        className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 min-h-[320px] max-h-[520px] bg-[#090A0F]/90 border-white/[0.08] flex flex-col justify-between"
      >
        {messages.length === 0 ? (
          /* =====================================================================
             7. EMPTY STATE (When no conversation yet)
             ===================================================================== */
          <div className="my-auto py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-cyan-300">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-sans font-bold text-sm text-white">
                Ask XIRA anything about what you're learning
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                {activeConceptName
                  ? `Get guidance, analogies, and quick practice for ${activeConceptName}.`
                  : `Your companion for questions, hints, and practice along ${goalTitle}.`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-2 text-left">
              {emptyStatePrompts.map((p) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => handleSendMessage(p.prompt)}
                    disabled={isLoading}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-cyan-400/30 hover:bg-white/[0.06] transition-all group flex items-start gap-2.5 text-left"
                  >
                    <IconComponent className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover:text-cyan-300" />
                    <div className="min-w-0 flex-1">
                      <div className="font-sans font-semibold text-xs text-white group-hover:text-cyan-200 truncate">
                        {p.title}
                      </div>
                      <div className="font-sans text-[11px] text-slate-400 truncate">
                        {p.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 flex-1">
            {messages.map((msg) => {
              const isXira = msg.sender === 'xira';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isXira ? 'justify-start' : 'justify-end'}`}
                >
                  {isXira && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-3 sm:p-3.5 rounded-2xl max-w-[88%] sm:max-w-[78%] space-y-2 text-xs sm:text-sm leading-relaxed ${
                      isXira
                        ? 'bg-[#151928] border border-white/[0.08] text-slate-200'
                        : 'bg-indigo-600 text-white rounded-br-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* After-Answer Actions & Audio */}
                    {isXira && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06] text-[11px]">
                        {/* Lightweight After-Answer Action */}
                        <div className="flex items-center gap-1.5">
                          <Link href="/quest">
                            <button
                              type="button"
                              className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] hover:underline flex items-center gap-1"
                            >
                              Practice quest →
                            </button>
                          </Link>
                        </div>

                        {/* Read Aloud Button */}
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className="text-slate-400 hover:text-cyan-300 p-1 transition-colors"
                          title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-cyan-300" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center text-slate-400 font-mono text-xs pt-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span>XIRA is formulating explanation...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      {/* =========================================================================
          8 & 9. INPUT BAR (Mobile-Friendly & Accessible)
          ========================================================================= */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeConceptName
              ? `Ask about ${activeConceptName}...`
              : `Ask XIRA about ${goalTitle}...`
          }
          className="flex-1 h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl bg-[#0D0F18] border border-white/[0.12] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!input.trim() || isLoading}
          leftIcon={<Send className="w-4 h-4" />}
          className="h-11 sm:h-12 px-4"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
