'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StateHud } from '@/components/StateHud';
import { SeededItem } from '@/lib/seed';
import { getStoreData, recordAttempt, saveActiveSession, clearActiveSession, selectNextTarget, setGraphContent, Attempt, FlowState } from '@/lib/store';
import { selectQuest } from '@/lib/engine/difficulty';

const SESSION_STORAGE_KEY = 'xpedition_active_quest_session';

interface SessionState {
  items: SeededItem[];
  currentIndex: number;
  attempts: Attempt[];
  initialFlowState: FlowState;
  conceptId?: string;
  totalLength: number;
}

function QuestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const conceptParam = searchParams.get('concept');
  const lenParam = searchParams.get('len');

  const [session, setSession] = useState<SessionState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isExhausted, setIsExhausted] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Telemetry metrics
  const [hesitationSeconds, setHesitationSeconds] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hintCount, setHintCount] = useState<number>(0);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Dynamic Learner State Metrics
  const [currentFlowState, setCurrentFlowState] = useState<FlowState>('flow');
  const [targetSuccessRate, setTargetSuccessRate] = useState<number>(78);
  const [abilityTheta, setAbilityTheta] = useState<number>(0.45);
  const [nextDifficultyB, setNextDifficultyB] = useState<number>(0.50);
  const [whySignals, setWhySignals] = useState<string[]>([
    'Balanced response latency',
    'Accuracy on recent items',
    'Adaptive challenge alignment',
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track tab switches for behavioral telemetry
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Initialize or resume quest session with adaptive unseen item selection
  useEffect(() => {
    const store = getStoreData();
    const target = selectNextTarget(store);

    const targetConceptId = conceptParam || (target.inProgress ? target.conceptId : undefined);

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        try {
          const parsed: SessionState = JSON.parse(stored);
          if (parsed && parsed.items && parsed.items.length > 0 && parsed.currentIndex < parsed.totalLength) {
            if (!targetConceptId || parsed.conceptId === targetConceptId || parsed.items[0]?.conceptId === targetConceptId) {
              setSession(parsed);
              setCurrentFlowState(parsed.initialFlowState || 'flow');
              return;
            }
          }
        } catch (e) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    }

    let totalLen = target.totalLength || 6;
    if (lenParam) {
      totalLen = parseInt(lenParam, 10) || 3;
    } else if (store.flowState === 'drifting') {
      totalLen = 4;
    }

    const activeQuests = store.quests || [];
    const conceptsMap = new Map((store.concepts || []).map((c) => [c.id, c.name]));

    const pool: SeededItem[] = activeQuests.map((q: any) => ({
      id: q.id,
      conceptId: q.conceptId,
      conceptName: conceptsMap.get(q.conceptId) || store.goalText || 'Core Concept',
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.answerIndex ?? q.correctIndex ?? 0,
      explanation: q.explanation || '',
      difficulty: Number(q.difficulty) || 0,
    }));

    // Construct seenIds Set from past attempts for the active graph
    const seenIds = new Set<string>();
    (store.attempts || []).forEach((att) => {
      if (att.id) seenIds.add(att.id);
    });

    // Adaptive Selection via lib/engine/difficulty.ts (excluding seen items)
    const sessionItems: SeededItem[] = [];
    const currentTheta = store.calibratedTheta ?? -0.4;
    const candidatePool = targetConceptId ? pool.filter((i) => i.conceptId === targetConceptId) : pool;

    for (let i = 0; i < totalLen; i++) {
      const nextItem = selectQuest(candidatePool, currentTheta, store.flowState, seenIds);
      if (nextItem) {
        sessionItems.push(nextItem);
        seenIds.add(nextItem.id);
      } else {
        // If targeted concept items are exhausted, search across the broader path pool
        const nextPathItem = selectQuest(pool, currentTheta, store.flowState, seenIds);
        if (nextPathItem) {
          sessionItems.push(nextPathItem);
          seenIds.add(nextPathItem.id);
        } else {
          break;
        }
      }
    }

    // Check for item bank exhaustion
    if (sessionItems.length === 0) {
      setIsExhausted(true);
      return;
    }

    // Resume position if persistent activeSession exists for this concept
    let initialIndex = 0;
    const activeSession = store.activeSession;
    if (activeSession && activeSession.conceptId === (targetConceptId || sessionItems[0]?.conceptId) && activeSession.currentIndex < sessionItems.length) {
      initialIndex = activeSession.currentIndex;
    }

    const newSession: SessionState = {
      items: sessionItems,
      currentIndex: initialIndex,
      attempts: [],
      initialFlowState: store.flowState,
      conceptId: targetConceptId || sessionItems[0]?.conceptId,
      totalLength: sessionItems.length,
    };

    setSession(newSession);
    setCurrentFlowState(store.flowState || 'flow');

    saveActiveSession({
      conceptId: newSession.conceptId || sessionItems[0]?.conceptId || '',
      conceptName: sessionItems[0]?.conceptName || 'Core Concept',
      currentIndex: initialIndex,
      totalLength: sessionItems.length,
      completedItemIds: [],
      updatedAt: Date.now(),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    }
  }, [conceptParam, lenParam]);

  // Handle regenerating a fresh item bank when exhausted
  const handleRegenerateBank = async () => {
    setIsRegenerating(true);
    const store = getStoreData();
    const goal = store.goalText || 'Learning Goal';

    try {
      const res = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, bypassCache: true }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.concepts) && Array.isArray(data.quests)) {
          const formattedConcepts = data.concepts.map((c: any) => ({
            id: c.id,
            name: c.name,
            masteryPercentage: 0,
            itemsNext: 3,
            retentionRisk: 0.0,
            ptsSinceCalibration: 0,
          }));
          setGraphContent(goal, formattedConcepts, data.quests, false);
          clearActiveSession();
          if (typeof window !== 'undefined') {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Failed to regenerate item bank:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Hesitation timer
  useEffect(() => {
    if (isSubmitted) return;

    timerRef.current = setInterval(() => {
      setHesitationSeconds((prev) => {
        const nextSec = prev + 1;
        if (nextSec > 15 && currentFlowState === 'flow') {
          setWhySignals(['Extended latency before first selection', 'Elevated cognitive load']);
        }
        return nextSec;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, session?.currentIndex, currentFlowState]);

  if (isExhausted) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-[#120E22] border border-line rounded-[20px] p-8 space-y-6">
          <div className="w-14 h-14 rounded-full bg-cyan/15 border border-cyan/30 text-cyan text-2xl flex items-center justify-center mx-auto">
            🎓
          </div>
          <div className="space-y-2">
            <h1 className="font-sans font-bold text-xl text-text">Path Items Exhausted</h1>
            <p className="font-sans text-xs text-muted leading-relaxed">
              You&apos;ve cleared every generated item in this learning path! No item recycling.
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              disabled={isRegenerating}
              onClick={handleRegenerateBank}
              className="w-full h-[46px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer"
            >
              <span>{isRegenerating ? 'Generating fresh questions...' : '🔄 Generate 14 Fresh Items'}</span>
            </button>
            <Link
              href="/home"
              className="block font-mono text-xs text-muted hover:text-text pt-1"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !session.items[session.currentIndex]) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4">
        <div className="font-mono text-sm text-muted animate-pulse">Loading adaptive quest item...</div>
      </div>
    );
  }

  const currentItem = session.items[session.currentIndex];
  const isLastItem = session.currentIndex === session.totalLength - 1;

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    if (selectedOption !== null && selectedOption !== idx) {
      setRetryCount((prev) => prev + 1);
    }
    setSelectedOption(idx);
  };

  const handleToggleHint = () => {
    if (!showHint) {
      setHintCount((prev) => prev + 1);
    }
    setShowHint(!showHint);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;

    setIsSubmitted(true);
    const isCorrect = selectedOption === currentItem.correctIndex;

    const recentAttempts = [...session.attempts, {
      id: currentItem.id, // Store quest item ID on attempt for exact exclusion
      conceptId: currentItem.conceptId,
      conceptName: currentItem.conceptName,
      isCorrect,
      timestamp: Date.now(),
    }];

    if (!isCorrect && (hesitationSeconds > 10 || hintCount > 0 || retryCount > 0)) {
      setCurrentFlowState('frustrated');
      setTargetSuccessRate(92);
      setAbilityTheta(0.20);
      setNextDifficultyB(0.15);
      setWhySignals([
        'Elevated hesitation latency (>10s)',
        'Option selection changed multiple times',
        'Scaffolding hint opened',
        'Incorrect answer submitted',
      ]);
    } else if (isCorrect && hesitationSeconds < 4 && hintCount === 0 && retryCount === 0) {
      setCurrentFlowState('bored');
      setTargetSuccessRate(62);
      setAbilityTheta(0.85);
      setNextDifficultyB(0.90);
      setWhySignals([
        'Sub-4s instant response latency',
        'Zero retries or scaffolding needed',
        'High consecutive accuracy',
      ]);
    } else if (isCorrect) {
      setCurrentFlowState('flow');
      setTargetSuccessRate(78);
      setAbilityTheta(0.55);
      setNextDifficultyB(0.60);
      setWhySignals([
        'Steady response latency',
        'High accuracy trend',
        'Optimal challenge match',
      ]);
    }

    const newAttempt: Attempt = {
      id: currentItem.id, // Exact quest ID stored for seenIds filtering
      conceptId: currentItem.conceptId,
      conceptName: currentItem.conceptName,
      isCorrect,
      timestamp: Date.now(),
    };

    recordAttempt(newAttempt);

    const updatedSession: SessionState = {
      ...session,
      attempts: recentAttempts,
    };

    setSession(updatedSession);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    }
  };

  const handleNextItem = () => {
    if (isLastItem) {
      clearActiveSession(currentItem.conceptName);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      router.push('/session-summary');
    } else {
      const nextIndex = session.currentIndex + 1;
      const updatedSession: SessionState = {
        ...session,
        currentIndex: nextIndex,
      };
      setSession(updatedSession);
      setSelectedOption(null);
      setIsSubmitted(false);
      setShowHint(false);
      setHesitationSeconds(0);

      saveActiveSession({
        conceptId: session.conceptId || currentItem.conceptId,
        conceptName: currentItem.conceptName,
        currentIndex: nextIndex,
        totalLength: session.totalLength,
        completedItemIds: session.items.slice(0, nextIndex).map((i) => i.id),
        updatedAt: Date.now(),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-ink text-text select-none relative pb-[120px] lg:pb-8">
      {/* Top Header Bar */}
      <header className="h-[60px] px-4 sm:px-6 border-b border-line/60 flex items-center justify-between bg-[#120E22]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/home" className="text-muted hover:text-text font-mono text-xs flex items-center gap-1">
            ✕ Exit
          </Link>
          <span className="h-4 w-[1px] bg-line" />
          <span className="font-mono text-xs text-cyan font-semibold">
            {session.currentIndex + 1} / {session.totalLength}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-muted tracking-eyebrow hidden sm:inline font-bold">
            {currentItem.conceptName}
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-raised border border-line text-text">
            Diff (b): {currentItem.difficulty > 0 ? `+${currentItem.difficulty}` : currentItem.difficulty}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Dynamic Learner State HUD Strip */}
        <StateHud
          flowState={currentFlowState}
          hesitationSeconds={hesitationSeconds}
          retryCount={retryCount}
          hintCount={hintCount}
          tabSwitchCount={tabSwitchCount}
          abilityTheta={abilityTheta}
          nextDifficultyB={nextDifficultyB}
          targetSuccessRate={targetSuccessRate}
          whySignals={whySignals}
        />

        {/* Quest Item Card */}
        <div className="bg-[#120E22]/90 border border-line rounded-[20px] p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              QUESTION {session.currentIndex + 1} OF {session.totalLength} ({currentItem.id})
            </span>
            <h1 className="font-sans font-semibold text-lg sm:text-xl text-text leading-snug">
              {currentItem.prompt}
            </h1>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentItem.options.map((optionText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentItem.correctIndex;

              let optionStyle = 'bg-[#1A1430]/85 border-white/[0.09] hover:border-cyan text-text';

              if (isSubmitted) {
                if (isCorrect) {
                  optionStyle = 'bg-success/15 border-success text-success font-semibold';
                } else if (isSelected) {
                  optionStyle = 'bg-danger/15 border-danger text-danger font-semibold';
                } else {
                  optionStyle = 'bg-[#1A1430]/40 border-transparent text-muted/50';
                }
              } else if (isSelected) {
                optionStyle = 'bg-raised border-cyan text-text shadow-[0_0_15px_rgba(0,229,255,0.2)]';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleOptionSelect(idx)}
                  className={`w-full min-h-[52px] p-4 rounded-[12px] border text-left font-sans text-sm flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                >
                  <div className="flex items-center gap-3 pr-2">
                    <span className="font-mono text-xs font-bold text-muted min-w-[20px]">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="leading-snug">{optionText}</span>
                  </div>

                  {isSubmitted && isCorrect && (
                    <span className="w-5 h-5 rounded-full bg-success text-ink flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isSubmitted && (
            <div className="p-4 rounded-[12px] bg-panel border border-line space-y-1 animate-fadeIn">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                EXPLANATION
              </span>
              <p className="font-sans text-xs text-muted leading-relaxed">
                {currentItem.explanation}
              </p>
            </div>
          )}

          {/* Scaffolding Hint */}
          {showHint && (
            <div className="p-3.5 rounded-[12px] bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans animate-fadeIn">
              💡 <strong>Hint:</strong> Focus on the primary metabolic output or key enzyme action involved.
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-line/50">
            <button
              type="button"
              onClick={handleToggleHint}
              className="font-mono text-xs text-muted hover:text-cyan transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{showHint ? 'Hide Hint' : '💡 Hint'}</span>
            </button>

            {!isSubmitted ? (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
                className={`h-[46px] px-6 rounded-[12px] font-sans font-semibold text-xs transition-all cursor-pointer ${
                  selectedOption !== null
                    ? 'bg-signature-gradient text-white hover:brightness-108'
                    : 'bg-raised/60 text-muted border border-line/40 cursor-not-allowed'
                }`}
              >
                Submit Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextItem}
                className="h-[46px] px-6 rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center gap-2 hover:brightness-108 transition-all cursor-pointer"
              >
                <span>{isLastItem ? 'Complete Quest' : 'Next Question'}</span>
                <span>→</span>
              </button>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}

export default function QuestPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 font-mono text-sm text-muted animate-pulse">Loading quest environment...</div>}>
      <QuestContent />
    </Suspense>
  );
}
