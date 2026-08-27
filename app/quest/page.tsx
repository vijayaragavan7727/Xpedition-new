'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StateHud } from '@/components/StateHud';
import { getStoreData, recordAttempt, saveActiveSession, clearActiveSession, selectNextTarget, setGraphContent, computeItemHash, Attempt, FlowState } from '@/lib/store';
import { selectQuest, TARGET_SUCCESS, idealDifficulty } from '@/lib/engine/difficulty';
import { MotivationState, Quest as SeededItem } from '@/lib/types';

const SESSION_STORAGE_KEY = 'xpedition_active_quest_session';

interface SessionState {
  items: SeededItem[];
  currentIndex: number;
  attempts: Attempt[];
  initialFlowState: FlowState;
  conceptId?: string;
  totalLength: number;
  isSolo?: boolean;
}

function QuestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const conceptParam = searchParams.get('concept');
  const lenParam = searchParams.get('len');
  const modeParam = searchParams.get('mode');
  const isSoloRequested = modeParam === 'solo';

  const [session, setSession] = useState<SessionState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userConfidence, setUserConfidence] = useState<'known' | 'unsure' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isExhausted, setIsExhausted] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [showSoloPreScreen, setShowSoloPreScreen] = useState<boolean>(isSoloRequested);

  const isSoloMode = Boolean(session?.isSolo || (isSoloRequested && showSoloPreScreen));

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

    if (typeof window !== 'undefined' && !isSoloRequested) {
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

    let totalLen = isSoloRequested ? 6 : (target.totalLength || 6);
    if (lenParam && !isSoloRequested) {
      totalLen = parseInt(lenParam, 10) || 3;
    } else if (store.flowState === 'drifting' && !isSoloRequested) {
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
    const currentTheta = isSoloRequested
      ? (store.concepts?.find((c) => c.id === targetConceptId)?.thetaSolo ?? store.calibratedTheta ?? -0.4)
      : (store.calibratedTheta ?? -0.4);
    
    const candidatePool = targetConceptId ? pool.filter((i) => i.conceptId === targetConceptId) : pool;

    for (let i = 0; i < totalLen; i++) {
      const { quest: nextItem } = selectQuest(candidatePool, currentTheta, store.flowState || 'flow', seenIds);
      if (nextItem) {
        sessionItems.push(nextItem as SeededItem);
        seenIds.add(nextItem.id);
      } else {
        // If targeted concept items are exhausted, search across the broader path pool
        const { quest: nextPathItem } = selectQuest(pool, currentTheta, store.flowState || 'flow', seenIds);
        if (nextPathItem) {
          sessionItems.push(nextPathItem as SeededItem);
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
    if (!isSoloRequested && activeSession && activeSession.conceptId === (targetConceptId || sessionItems[0]?.conceptId) && activeSession.currentIndex < sessionItems.length) {
      initialIndex = activeSession.currentIndex;
    }

    const newSession: SessionState = {
      items: sessionItems,
      currentIndex: initialIndex,
      attempts: [],
      initialFlowState: store.flowState,
      conceptId: targetConceptId || sessionItems[0]?.conceptId,
      totalLength: sessionItems.length,
      isSolo: isSoloRequested,
    };

    setSession(newSession);
    setCurrentFlowState(store.flowState || 'flow');

    if (!isSoloRequested) {
      saveActiveSession({
        conceptId: newSession.conceptId || sessionItems[0]?.conceptId || '',
        conceptName: sessionItems[0]?.conceptName || 'Core Concept',
        currentIndex: initialIndex,
        totalLength: sessionItems.length,
        completedItemIds: [],
        updatedAt: Date.now(),
      });
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    }
  }, [conceptParam, lenParam, modeParam]);

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

  const handleStartSoloSession = () => {
    setShowSoloPreScreen(false);
  };

  const handleExitQuest = () => {
    if (session?.isSolo && session.attempts.length > 0) {
      // Void mid-session exit attempts
      session.attempts.forEach((att) => {
        const voidAttempt: Attempt = { ...att, isSolo: true, isVoid: true };
        recordAttempt(voidAttempt);
      });
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    router.push('/home');
  };

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    if (selectedOption !== null && selectedOption !== idx) {
      setRetryCount((prev) => prev + 1);
    }
    setSelectedOption(idx);
  };

  const handleToggleHint = () => {
    if (session?.isSolo) return; // No hints in Solo mode
    if (!showHint) {
      setHintCount((prev) => prev + 1);
    }
    setShowHint(!showHint);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted || !session) return;

    setIsSubmitted(true);
    const currentItem = session.items[session.currentIndex];
    const isCorrect = selectedOption === currentItem.correctIndex;

    const recentAttempts = [...session.attempts, {
      id: currentItem.id,
      conceptId: currentItem.conceptId,
      conceptName: currentItem.conceptName || 'Core Concept',
      isCorrect,
      confidence: userConfidence || undefined,
      isSolo: session.isSolo || false,
      timestamp: Date.now(),
    }];

    const nextMotivation: MotivationState =
      !isCorrect && (hesitationSeconds > 10 || hintCount > 0 || retryCount > 0)
        ? 'frustrated'
        : isCorrect && hesitationSeconds < 4 && hintCount === 0 && retryCount === 0
          ? 'bored'
          : 'flow';

    const currentStoreData = getStoreData();
    const currentTheta = currentStoreData.calibratedTheta ?? -0.4;
    const targetProb = TARGET_SUCCESS[nextMotivation] ?? 0.78;
    const idealDiff = idealDifficulty(currentTheta, targetProb);

    setCurrentFlowState(nextMotivation);
    setTargetSuccessRate(Math.round(targetProb * 100));
    setAbilityTheta(Number(currentTheta.toFixed(2)));
    setNextDifficultyB(Number(idealDiff.toFixed(2)));

    if (nextMotivation === 'frustrated') {
      setWhySignals([
        'Elevated hesitation latency (>10s)',
        'Option selection changed multiple times',
        session.isSolo ? 'Incorrect answer submitted — Solo mode (Interventions suppressed)' : 'Incorrect answer submitted — target success set to 92%',
      ]);
    } else if (nextMotivation === 'bored') {
      setWhySignals([
        'Sub-4s instant response latency',
        'High consecutive accuracy — target success set to 62%',
      ]);
    } else {
      setWhySignals([
        'Steady response latency',
        'Optimal challenge match — target success set to 78%',
      ]);
    }

    const itemHash = computeItemHash(currentItem.prompt || (currentItem as any).ask || '', currentItem.options);

    const newAttempt: Attempt = {
      id: currentItem.id,
      conceptId: currentItem.conceptId,
      conceptName: currentItem.conceptName || 'Core Concept',
      isCorrect,
      confidence: userConfidence || undefined,
      isSolo: session.isSolo || false,
      timestamp: Date.now(),
      chosenIndex: selectedOption,
      chosenText: currentItem.options[selectedOption],
      correctIndex: currentItem.correctIndex ?? currentItem.answerIndex ?? 0,
      itemHash,
    };

    recordAttempt(newAttempt);

    const updatedSession: SessionState = {
      ...session,
      attempts: recentAttempts,
    };

    setSession(updatedSession);
  };

  const handleNextItem = () => {
    if (!session) return;
    const currentItem = session.items[session.currentIndex];
    const isLastItem = session.currentIndex === session.totalLength - 1;

    if (isLastItem) {
      if (!session.isSolo) {
        clearActiveSession(currentItem.conceptName);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      router.push(`/session-summary${session.isSolo ? '?mode=solo' : ''}`);
    } else {
      const nextIndex = session.currentIndex + 1;
      const updatedSession: SessionState = {
        ...session,
        currentIndex: nextIndex,
      };
      setSession(updatedSession);
      setSelectedOption(null);
      setUserConfidence(null);
      setIsSubmitted(false);
      setShowHint(false);
      setHesitationSeconds(0);

      if (!session.isSolo) {
        saveActiveSession({
          conceptId: session.conceptId || currentItem.conceptId,
          conceptName: currentItem.conceptName || 'Core Concept',
          currentIndex: nextIndex,
          totalLength: session.totalLength,
          completedItemIds: session.items.slice(0, nextIndex).map((i) => i.id),
          updatedAt: Date.now(),
        });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }
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
              Not now
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

  return (
    <div className="h-[100dvh] w-full bg-ink text-text select-none relative flex flex-col justify-between overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-[60px] px-4 sm:px-6 border-b border-line/60 flex items-center justify-between bg-[#120E22]/80 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExitQuest}
            className="text-muted hover:text-text font-mono text-xs flex items-center gap-1 cursor-pointer"
          >
            ✕ Exit
          </button>
          <span className="h-4 w-[1px] bg-line" />
          <span className="font-mono text-xs text-cyan font-semibold">
            {session.currentIndex + 1} / {session.totalLength}
          </span>
        </div>

        {session.isSolo && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 font-mono text-[10px] uppercase font-bold tracking-wider animate-pulse">
            <span>🔒</span>
            <span>SOLO MODE — NO HELP REACHABLE</span>
          </div>
        )}

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
      <main className="flex-1 min-h-0 max-w-2xl w-full mx-auto px-3.5 sm:px-6 py-2.5 sm:py-4 flex flex-col justify-between overflow-hidden">
        
        {/* Dynamic Learner State HUD Strip */}
        {!session.isSolo && (
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
        )}

        {/* Quest Item Card */}
        <div className="bg-[#120E22]/90 border border-line rounded-[20px] p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="space-y-1.5 sm:space-y-2">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              QUESTION {session.currentIndex + 1} OF {session.totalLength} ({currentItem.id})
            </span>
            <h1 className="font-sans font-semibold text-base sm:text-xl text-text leading-snug">
              {currentItem.prompt}
            </h1>
          </div>

          {/* CONFIDENCE ASK (BEFORE OPTIONS ARE REVEALED) */}
          {userConfidence === null ? (
            <div className="p-4 sm:p-5 rounded-[16px] bg-[#1A1430]/90 border border-violet/40 space-y-3 sm:space-y-4 animate-fadeIn my-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <div className="text-center space-y-1">
                <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                  CONFIDENCE CHECK
                </span>
                <h2 className="font-sans font-semibold text-base sm:text-lg text-text">
                  Do you know this?
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-0.5">
                <button
                  type="button"
                  onClick={() => setUserConfidence('known')}
                  className="h-[44px] px-3 rounded-[12px] bg-cyan/15 border border-cyan/50 hover:border-cyan text-cyan font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-cyan/25 active:scale-98 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                >
                  <span className="text-base">✓</span>
                  <span>I know this</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserConfidence('unsure')}
                  className="h-[44px] px-3 rounded-[12px] bg-raised border border-line hover:border-muted text-text font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-raised/80 active:scale-98"
                >
                  <span className="text-base">?</span>
                  <span>Not sure</span>
                </button>
              </div>
            </div>
          ) : (
            /* OPTIONS (REVEALED ONLY AFTER CONFIDENCE SELECTION) */
            <div className="space-y-2 sm:space-y-3 animate-fadeIn">
              {currentItem.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentItem.correctIndex;

                let optionStyle = 'bg-[#1A1430]/85 border-white/[0.09] hover:border-cyan text-text';

                if (isSubmitted) {
                  if (session.isSolo) {
                    // Solo Mode: NO MID-SESSION FEEDBACK (No green/red)
                    optionStyle = isSelected
                      ? 'bg-violet-600/30 border-violet text-text font-semibold'
                      : 'bg-[#1A1430]/40 border-transparent text-muted/50';
                  } else {
                    if (isCorrect) {
                      optionStyle = 'bg-success/15 border-success text-success font-semibold';
                    } else if (isSelected) {
                      optionStyle = 'bg-danger/15 border-danger text-danger font-semibold';
                    } else {
                      optionStyle = 'bg-[#1A1430]/40 border-transparent text-muted/50';
                    }
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
                    className={`w-full min-h-[46px] p-3 rounded-[12px] border text-left font-sans text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="font-mono text-xs font-bold text-muted min-w-[20px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </div>

                    {!session.isSolo && isSubmitted && isCorrect && (
                      <span className="w-5 h-5 rounded-full bg-success text-ink flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* THE BLIND-SPOT MOMENT (ONLY IN ASSISTED MODE) */}
          {!session.isSolo && isSubmitted && userConfidence === 'known' && selectedOption !== currentItem.correctIndex && (
            <div className="p-5 rounded-[14px] bg-amber-500/15 border border-amber-500/50 space-y-2 animate-fadeIn shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Worth stopping on.
                </span>
              </div>
              <p className="font-sans text-xs text-amber-200/90 leading-relaxed font-normal">
                You expected to get this. That gap between what you think you know and what you do know is where exams and interviews catch people out.
              </p>
            </div>
          )}

          {/* Explanation Banner (ONLY IN ASSISTED MODE) */}
          {!session.isSolo && isSubmitted && (
            <div className="p-4 rounded-[12px] bg-panel border border-line space-y-1 animate-fadeIn">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                EXPLANATION
              </span>
              <p className="font-sans text-xs text-muted leading-relaxed">
                {currentItem.explanation}
              </p>
            </div>
          )}

          {/* Scaffolding Hint (ONLY IN ASSISTED MODE) */}
          {!session.isSolo && showHint && (
            <div className="p-3.5 rounded-[12px] bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans animate-fadeIn">
              💡 <strong>Hint:</strong> Focus on the primary metabolic output or key enzyme action involved.
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-line/50">
            {!session.isSolo ? (
              <button
                type="button"
                onClick={handleToggleHint}
                className="font-mono text-xs text-muted hover:text-cyan transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{showHint ? 'Hide Hint' : '💡 Hint'}</span>
              </button>
            ) : (
              <span className="font-mono text-[10px] uppercase text-violet-400 font-bold tracking-wider">
                🔒 Solo (No Assistance)
              </span>
            )}

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
