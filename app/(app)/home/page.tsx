'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, calculateStreak, selectNextTarget, UserStoreData } from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { useWorldState } from '@/lib/hooks/world';
import { WorldBuilding, detectBuildingStateTransitions } from '@/lib/worldEngine';
import { WorldThemeId } from '@/lib/themes';
import XyraGreetingWidget from '@/components/XyraGreetingWidget';
import WorldUnlockCelebration from '@/components/WorldUnlockCelebration';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import {
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Target,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface ChatExchange {
  id: string;
  query: string;
  reply: string;
  timestamp: number;
}

export default function HomePage() {
  const router = useRouter();
  const { storeData, worldState } = useWorldState();
  const [unlockedBuilding, setUnlockedBuilding] = useState<WorldBuilding | null>(null);
  const [robotImgPath, setRobotImgPath] = useState<string>('/robot.png');

  // Inline Ask XYRA State
  const [inlineInput, setInlineInput] = useState<string>('');
  const [chatExchanges, setChatExchanges] = useState<ChatExchange[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [homeChatCount, setHomeChatCount] = useState<number>(0);
  const [speakingExchangeId, setSpeakingExchangeId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!worldState) return;

    if (typeof window !== 'undefined') {
      try {
        const savedBuildingsStr = localStorage.getItem(`xpedition_prev_buildings_${worldState.skillGraphId}`);
        if (savedBuildingsStr) {
          const prevBuildings: WorldBuilding[] = JSON.parse(savedBuildingsStr);
          const newUnlocks = detectBuildingStateTransitions(prevBuildings, worldState.buildings);
          if (newUnlocks.length > 0) {
            setUnlockedBuilding(newUnlocks[0]);
          }
        }
        localStorage.setItem(
          `xpedition_prev_buildings_${worldState.skillGraphId}`,
          JSON.stringify(worldState.buildings)
        );
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      const todayStr = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem('xyra_home_chat_date');
      const savedCount = parseInt(localStorage.getItem('xyra_home_chat_count') || '0', 10);

      if (savedDate === todayStr) {
        setHomeChatCount(savedCount);
      } else {
        localStorage.setItem('xyra_home_chat_date', todayStr);
        localStorage.setItem('xyra_home_chat_count', '0');
        setHomeChatCount(0);
      }
    }
  }, [worldState]);

  const streak = storeData ? calculateStreak(storeData.attempts) : 0;
  const fadingConcepts = storeData ? storeData.concepts.filter((c) => c.retentionRisk > 0.35) : [];
  const hasSkillGraph = storeData ? storeData.concepts.length > 0 : false;
  const target = storeData ? selectNextTarget(storeData) : null;

  useEffect(() => {
    if (storeData && target?.conceptId) {
      const cacheKey = `xyra_lesson_${target.conceptId}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(cacheKey)) {
        fetch('/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId: target.conceptId,
            conceptName: target.conceptName,
            conceptSummary: '',
            language: storeData?.learnerProfile?.language || 'english',
            startingLevel: storeData?.learnerProfile?.startingLevel || 'Complete beginner',
            masteryPercentage: target.masteryPercentage || 0,
            isQuickLearn: false,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.chunks && typeof window !== 'undefined') {
              sessionStorage.setItem(cacheKey, JSON.stringify(data));
            }
          })
          .catch(() => {});
      }
    }
  }, [storeData?.activeGraphId, target?.conceptId]);

  if (!storeData || !target) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Xpedition Dashboard...</span>
      </div>
    );
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingExchangeId(null);
  };

  const handleSpeakInlineText = async (exchangeId: string, text: string) => {
    if (speakingExchangeId === exchangeId) {
      stopAudio();
      return;
    }

    stopAudio();
    setSpeakingExchangeId(exchangeId);

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: storeData?.learnerProfile?.language || 'english',
          speaker: 'ratan',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setSpeakingExchangeId(null);
          audio.onerror = () => playBrowserFallback(text);
          audio.play().catch(() => playBrowserFallback(text));
          return;
        }
      }
    } catch (e) {}

    playBrowserFallback(text);
  };

  const playBrowserFallback = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingExchangeId(null);
      utterance.onerror = () => setSpeakingExchangeId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setSpeakingExchangeId(null);
    }
  };

  const handleSendHomeChat = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isChatLoading || homeChatCount >= 5) return;

    setIsChatLoading(true);
    setInlineInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context: {
            scope: 'home',
            name: storeData.handle,
            goal: storeData.goalText,
            concepts: storeData.concepts,
            fadingConcepts: fadingConcepts,
            language: storeData?.learnerProfile?.language || 'english',
          },
        }),
      });

      let reply = `Keep moving forward on ${storeData.goalText}! Would you like to practice your next topic?`;
      if (res.ok) {
        const data = await res.json();
        if (data?.reply) reply = data.reply;
      }

      const newExchange: ChatExchange = {
        id: `exch_${Date.now()}`,
        query: trimmed,
        reply,
        timestamp: Date.now(),
      };

      setChatExchanges((prev) => [...prev, newExchange]);

      const nextCount = homeChatCount + 1;
      setHomeChatCount(nextCount);
      if (typeof window !== 'undefined') {
        localStorage.setItem('xyra_home_chat_count', String(nextCount));
      }

      handleSpeakInlineText(newExchange.id, reply);
    } catch (err) {
      const fallbackExchange: ChatExchange = {
        id: `exch_${Date.now()}`,
        query: trimmed,
        reply: `You are making steady progress toward ${storeData.goalText}. Let's continue with ${target.conceptName}!`,
        timestamp: Date.now(),
      };
      setChatExchanges((prev) => [...prev, fallbackExchange]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const attemptConceptIds = new Set((storeData.attempts || []).map((a) => a.conceptId));

  const learningMode = storeData.learnerProfile?.learningMode || 'tutor';
  const showLessonFirst = !target.hasAttempts && !target.inProgress;
  const lessonPath = learningMode === 'read' ? '/learn' : '/tutor';

  const continueHref = showLessonFirst
    ? `${lessonPath}/${encodeURIComponent(target.conceptId)}`
    : `/quest?concept=${encodeURIComponent(target.conceptId)}`;

  const realConceptName =
    target.conceptName && target.conceptName !== 'Core Concept'
      ? target.conceptName
      : storeData.concepts?.[0]?.name || storeData.goalText || 'Active Topic';

  const activeThemeId = (storeData.learnerProfile?.worldTheme as WorldThemeId) || 'cosmos';

  return (
    <div className="space-y-6 select-none relative pb-16 font-sans">
      {/* 1. XYRA AI COACH & GREETING */}
      <section className="pt-1">
        <XyraGreetingWidget
          storeData={storeData}
          continueHref={continueHref}
          continueLabel={`Continue: ${realConceptName}`}
          fadingConcepts={fadingConcepts}
          streak={streak}
        />
      </section>

      {/* 2. INLINE AI TUTOR CHAT */}
      <Card variant="default" className="p-4 sm:p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center p-0.5 shadow-xs">
              <img
                src={robotImgPath}
                onError={() => {
                  if (robotImgPath === '/robot.png') setRobotImgPath('/images/robot.png');
                }}
                alt="XYRA"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-sans font-bold text-xs text-white">
                <span>XYRA AI Coach</span>
                <Badge variant="cyan" size="sm">
                  Active
                </Badge>
              </div>
              <span className="font-sans text-[11px] text-slate-400">
                Ask anything about your curriculum or study plan
              </span>
            </div>
          </div>

          <span className="font-mono text-[10px] text-slate-400 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-full">
            {homeChatCount}/5 Today
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { label: 'My weakest concept?', query: 'Which concept am I weakest at?' },
            { label: 'What to study next?', query: 'What should I study next?' },
            { label: 'How is my pace?', query: 'How is my overall learning progress and pace?' },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={homeChatCount >= 5 || isChatLoading}
              onClick={() => handleSendHomeChat(item.query)}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-cyan-300 text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              ✨ {item.label}
            </button>
          ))}
        </div>

        {/* Chat Exchanges */}
        {chatExchanges.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
            {chatExchanges.slice(-2).map((item) => (
              <div key={item.id} className="space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-3.5 py-2 rounded-2xl bg-indigo-600 text-white font-medium text-xs leading-snug rounded-tr-none shadow-md">
                    {item.query}
                  </div>
                </div>

                <div className="flex justify-start items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0 mt-0.5">
                    X
                  </div>
                  <div className="max-w-[85%] p-3 rounded-2xl bg-[#181C2E] border border-white/[0.08] text-slate-200 text-xs leading-relaxed rounded-tl-none space-y-2 shadow-sm">
                    <p>{item.reply}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => handleSpeakInlineText(item.id, item.reply)}
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        {speakingExchangeId === item.id ? (
                          <VolumeX className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                        <span>{speakingExchangeId === item.id ? 'Stop' : 'Read Aloud'}</span>
                      </button>
                      <span>XYRA</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isChatLoading && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>XYRA is analyzing your syllabus...</span>
          </div>
        )}

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendHomeChat(inlineInput);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            disabled={homeChatCount >= 5 || isChatLoading}
            value={inlineInput}
            onChange={(e) => setInlineInput(e.target.value)}
            placeholder={
              homeChatCount >= 5
                ? 'Daily message limit reached (5/5).'
                : 'Ask XYRA anything about your goal or topics...'
            }
            className="flex-1 h-10 px-3.5 rounded-xl bg-[#090A0F] border border-white/[0.12] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-40"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inlineInput.trim() || homeChatCount >= 5 || isChatLoading}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </form>
      </Card>

      {/* 3. HERO ADAPTIVE CONTINUE CARD */}
      <section className="sticky top-0 z-20 pt-1 -mt-1 bg-[#090A0F]/90 backdrop-blur-md rounded-2xl">
        <Card variant="highlight" className="p-5 sm:p-6 space-y-4">
          {hasSkillGraph ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" size="sm">
                    Recommended Next
                  </Badge>
                  <span className="font-mono text-xs text-slate-400">
                    {target.inProgress ? 'In Progress' : 'Ready to Start'}
                  </span>
                </div>
                <Badge variant="cyan" size="sm">
                  {target.masteryPercentage}% Mastery
                </Badge>
              </div>

              <div>
                <h2 className="font-sans font-black text-xl sm:text-2xl text-white tracking-tight">
                  {realConceptName}
                </h2>
                <p className="font-sans text-xs text-slate-300 mt-1">
                  Goal: {storeData.goalText}
                </p>
              </div>

              <ProgressBar
                value={
                  target.inProgress
                    ? Math.round((target.currentIndex / target.totalLength) * 100)
                    : target.masteryPercentage
                }
                variant="indigo"
                size="md"
                label="Module Progress"
              />

              <div className="pt-1">
                <Link href={continueHref} className="block">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full shadow-[0_8px_25px_-6px_rgba(99,102,241,0.5)]"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue Learning
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <h2 className="font-sans font-bold text-lg text-white">No active learning graph</h2>
              <p className="font-sans text-xs text-slate-400">
                Set up your target topic or syllabus to build your personal curriculum.
              </p>
              <Link href="/onboarding" className="inline-block">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Onboarding
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </section>

      {/* 4. CURRICULUM ROADMAP BREAKDOWN */}
      <Card variant="default" className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="font-sans font-bold text-sm text-white">Curriculum Roadmap</h3>
            <p className="font-mono text-[11px] text-slate-400">
              {storeData.concepts.length} Structured Concepts • {storeData.goalText}
            </p>
          </div>
          <Badge variant="default" size="sm">
            {storeData.attempts?.length || 0} Solved
          </Badge>
        </div>

        <div className="space-y-2.5">
          {storeData.concepts.map((concept, index) => {
            const hasAtt = attemptConceptIds.has(concept.id);
            const isFading = concept.retentionRisk > 0.35;

            const conceptHref = !hasAtt
              ? `${lessonPath}/${encodeURIComponent(concept.id)}`
              : `/quest?concept=${encodeURIComponent(concept.id)}`;

            const assistedPct =
              concept.thetaAssisted !== undefined
                ? thetaToPercent(concept.thetaAssisted)
                : concept.masteryPercentage;

            return (
              <Link
                key={concept.id}
                href={conceptHref}
                className="p-3.5 rounded-xl bg-[#181C2E]/80 border border-white/[0.06] hover:border-indigo-500/40 hover:bg-[#181C2E] flex items-center justify-between gap-3 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-mono text-xs font-bold text-slate-400 group-hover:text-cyan-300 transition-colors shrink-0">
                    {index + 1}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans text-sm text-white font-semibold group-hover:text-cyan-300 transition-colors truncate">
                        {concept.name}
                      </span>
                      {!hasAtt && (
                        <Badge variant="indigo" size="sm">
                          New
                        </Badge>
                      )}
                      {isFading && (
                        <Badge variant="danger" size="sm">
                          Fading
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 bg-[#090A0F] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                          style={{ width: `${assistedPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {assistedPct}% Mastery
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs text-slate-400 group-hover:text-cyan-400 transition-colors">
                  <span className="text-[11px] font-semibold hidden sm:inline">
                    {!hasAtt ? 'Learn' : isFading ? 'Drill' : 'Practice'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* World Unlock Celebration Modal */}
      <WorldUnlockCelebration
        unlockedBuilding={unlockedBuilding}
        allBuildings={worldState?.buildings || []}
        theme={activeThemeId}
        onDismiss={() => setUnlockedBuilding(null)}
      />
    </div>
  );
}
