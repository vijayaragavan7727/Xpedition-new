'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StateHud } from '@/components/StateHud';
import { getStoreData, recordAttempt, saveActiveSession, clearActiveSession, selectNextTarget, setGraphContent, computeItemHash, Attempt, FlowState } from '@/lib/store';
import { selectQuest, TARGET_SUCCESS, idealDifficulty } from '@/lib/engine/difficulty';
import { MotivationState, Quest as SeededItem } from '@/lib/types';
import { HelpCircle, Sparkles, X, Volume2, Play, ArrowRight, Zap, Layers } from 'lucide-react';
import { LearnOrLoseArena } from '@/components/game/LearnOrLoseArena';
import {
  processLearningOutcome,
  formatActionTitle,
  processAdaptiveExperienceLoop,
  AdaptiveExperienceLoopResult,
} from '@/lib/intelligence';
import {
  PROJECTILE_MOTION_QUEST,
  PROJECTILE_MOTION_EXPERIENCE,
  createExperienceResultFromTelemetry,
  OBJECT_MANIPULATION_QUEST,
  OBJECT_MANIPULATION_EXPERIENCE,
  createSpatialExperienceResult,
  MOLECULE_BUILDER_QUEST,
  MOLECULE_BUILDER_EXPERIENCE,
  createMoleculeExperienceResult,
  HEART_ANATOMY_QUEST,
  HEART_ANATOMY_EXPERIENCE,
  createHeartExperienceResult,
  CODE_DEBUGGING_QUEST,
  CODE_DEBUGGING_EXPERIENCE,
  createCodeExperienceResult,
  ExperienceResult,
  LearnerModelAdapter,
  experienceRegistry,
  TelemetryEmitter,
} from '@/lib/experience';
import { QuestBriefingCard } from '@/components/experience/QuestBriefingCard';
import { ExperienceReflectionCard } from '@/components/experience/ExperienceReflectionCard';
import { ExperienceContainer } from '@/components/experience/ExperienceContainer';
import { ObjectExperienceContainer } from '@/components/experience/ObjectExperienceContainer';
import { MoleculeExperienceContainer } from '@/components/experience/MoleculeExperienceContainer';
import { HeartExperienceContainer } from '@/components/experience/HeartExperienceContainer';
import { CodeExperienceContainer } from '@/components/experience/CodeExperienceContainer';

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
  const isArenaRequested = modeParam === 'arena';

  const [session, setSession] = useState<SessionState | null>(null);
  const [isArenaMode, setIsArenaMode] = useState<boolean>(isArenaRequested);
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

  // Ask XYRA Modal State in Quest
  const [isAskXyraOpen, setIsAskXyraOpen] = useState<boolean>(false);
  const [xyraResponse, setXyraResponse] = useState<string | null>(null);
  const [xyraLoading, setXyraLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Experiential Quest Lifecycle State
  const [experienceState, setExperienceState] = useState<'briefing' | 'interactive' | 'reflection'>('briefing');
  const [experienceResult, setExperienceResult] = useState<ExperienceResult | null>(null);
  const [experienceNextAction, setExperienceNextAction] = useState<any>(null);
  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveExperienceLoopResult | null>(null);

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
    }

    const seenIds = new Set<string>();
    store.attempts?.forEach((att) => {
      if (att.itemHash) seenIds.add(att.itemHash);
    });

    const activeGraph = store.graphs?.find((g) => g.id === store.activeGraphId) || store.graphs?.[0];
    let pool: SeededItem[] = (activeGraph?.quests as SeededItem[]) || [];

    if (targetConceptId === 'projectile_motion') {
      pool = [PROJECTILE_MOTION_QUEST as any];
    } else if (targetConceptId === 'spatial_reasoning') {
      pool = [OBJECT_MANIPULATION_QUEST as any];
    } else if (targetConceptId === 'molecular_bonding') {
      pool = [MOLECULE_BUILDER_QUEST as any];
    } else if (targetConceptId === 'human_heart_anatomy') {
      pool = [HEART_ANATOMY_QUEST as any];
    } else if (targetConceptId === 'python_debugging_basics') {
      pool = [CODE_DEBUGGING_QUEST as any];
    } else if (targetConceptId) {
      const filtered = pool.filter((q) => q.conceptId === targetConceptId);
      if (filtered.length > 0) pool = filtered;
    }

    const selectedItems: SeededItem[] = [];
    const poolCopy = [...pool];
    let currentTheta = activeGraph?.calibratedTheta ?? -0.4;
    let simMotivation: MotivationState = (store.flowState as MotivationState) || 'flow';

    for (let i = 0; i < totalLen; i++) {
      const { quest, ideal } = selectQuest(poolCopy, currentTheta, simMotivation, seenIds);
      if (quest) {
        selectedItems.push(quest);
        seenIds.add(quest.id);
        const idx = poolCopy.findIndex((q) => q.id === quest.id);
        if (idx >= 0) poolCopy.splice(idx, 1);
        currentTheta = ideal;
      } else {
        break;
      }
    }

    if (selectedItems.length === 0 && targetConceptId === 'projectile_motion') {
      selectedItems.push(PROJECTILE_MOTION_QUEST as any);
    } else if (selectedItems.length === 0 && targetConceptId === 'spatial_reasoning') {
      selectedItems.push(OBJECT_MANIPULATION_QUEST as any);
    } else if (selectedItems.length === 0 && targetConceptId === 'molecular_bonding') {
      selectedItems.push(MOLECULE_BUILDER_QUEST as any);
    } else if (selectedItems.length === 0 && targetConceptId === 'human_heart_anatomy') {
      selectedItems.push(HEART_ANATOMY_QUEST as any);
    } else if (selectedItems.length === 0 && targetConceptId === 'python_debugging_basics') {
      selectedItems.push(CODE_DEBUGGING_QUEST as any);
    }

    if (selectedItems.length === 0) {
      setIsExhausted(true);
      return;
    }

    const initialSession: SessionState = {
      items: selectedItems,
      currentIndex: 0,
      attempts: [],
      initialFlowState: store.flowState || 'flow',
      conceptId: targetConceptId || selectedItems[0]?.conceptId,
      totalLength: selectedItems.length,
      isSolo: isSoloRequested,
    };

    setSession(initialSession);
    setCurrentFlowState(initialSession.initialFlowState);

    if (!isSoloRequested) {
      saveActiveSession({
        conceptId: initialSession.conceptId || selectedItems[0]?.conceptId || 'c_1',
        conceptName: selectedItems[0]?.conceptName || 'Core Concept',
        currentIndex: 0,
        totalLength: selectedItems.length,
        completedItemIds: [],
        updatedAt: Date.now(),
      });
    }
  }, [conceptParam, lenParam, isSoloRequested]);

  // Live item hesitation timer
  useEffect(() => {
    if (isSubmitted || !session) return;
    timerRef.current = setInterval(() => {
      setHesitationSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, session]);

  const handleRegeneratePool = async () => {
    setIsRegenerating(true);
    const store = getStoreData();
    const goal = store.goalText || 'Python Core';

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
            retentionRisk: 0,
            ptsSinceCalibration: 0,
            baselineTheta: -0.4,
          }));

          setGraphContent(goal, formattedConcepts, data.quests, false);
          clearActiveSession();
          window.location.reload();
          return;
        }
      }
    } catch (err) {
      console.error('Failed to regenerate item bank:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    if (selectedOption !== null && selectedOption !== index) {
      setRetryCount((prev) => prev + 1);
    }
    setSelectedOption(index);
  };

  const handleToggleHint = () => {
    if (session?.isSolo) return;
    if (!showHint) {
      setHintCount((prev) => prev + 1);
    }
    setShowHint(!showHint);
  };

  // ASK XYRA HANDLER IN QUEST
  const handleAskXyra = async (type: 'explain' | 'hint' | 'lost') => {
    const currentItem = session?.items[session.currentIndex];
    if (!currentItem) return;
    setXyraLoading(true);
    setXyraResponse(null);

    if (type === 'hint') {
      const hintMsg = currentItem.explanation
        ? `Hint: ${currentItem.explanation.split('.')[0]}. Consider what the question is asking step-by-step.`
        : `Focus on the core principle of ${currentItem.conceptName || 'this concept'} and eliminate contradictory options.`;
      setXyraResponse(hintMsg);
      setXyraLoading(false);
      setHintCount((prev) => prev + 1);
      return;
    }

    if (type === 'lost') {
      const lostMsg = `Don't worry! For "${currentItem.conceptName || 'this concept'}", think of the simplest everyday example. Look at the key terms in the prompt and match them with fundamentals.`;
      setXyraResponse(lostMsg);
      setXyraLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: currentItem.conceptName || 'Core Concept',
          prompt: currentItem.prompt,
          chosen: selectedOption !== null ? currentItem.options[selectedOption] : '',
          correct: currentItem.options[currentItem.correctIndex ?? currentItem.answerIndex ?? 0],
          questId: currentItem.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setXyraResponse(data.advice || currentItem.explanation || 'Focus on how the core mechanism operates under standard conditions.');
      } else {
        setXyraResponse(currentItem.explanation || 'Focus on the main principle being tested here.');
      }
    } catch (e) {
      setXyraResponse(currentItem.explanation || 'Review the core rules of this topic.');
    } finally {
      setXyraLoading(false);
    }
  };

  const handleSpeakXyra = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted || !session) return;

    const currentItem = session.items[session.currentIndex];
    const correctIdx = currentItem.correctIndex ?? currentItem.answerIndex ?? 0;
    const isCorrect = selectedOption === correctIdx;

    setIsSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const itemHash = computeItemHash(currentItem.prompt, currentItem.options);
    const attempt: Attempt = {
      id: `att_${Date.now()}_${session.currentIndex}`,
      conceptId: currentItem.conceptId,
      conceptName: currentItem.conceptName || 'Core Concept',
      isCorrect,
      confidence: userConfidence || 'known',
      timestamp: Date.now(),
      isSolo: Boolean(session.isSolo),
      chosenIndex: selectedOption,
      chosenText: currentItem.options[selectedOption],
      correctIndex: correctIdx,
      itemHash,
    };

    const nextMotivation: MotivationState =
      !isCorrect && (hesitationSeconds > 10 || hintCount > 0 || retryCount > 0)
        ? 'frustrated'
        : isCorrect && hesitationSeconds < 4 && hintCount === 0 && retryCount === 0
          ? 'bored'
          : 'flow';

    const currentStoreData = getStoreData();
    const currentTheta = currentStoreData.calibratedTheta ?? -0.4;
    const target = TARGET_SUCCESS[nextMotivation] ?? 0.8;
    const idealDiff = idealDifficulty(currentTheta, target);

    setCurrentFlowState(nextMotivation);
    setTargetSuccessRate(Math.round(target * 100));
    setAbilityTheta(parseFloat(currentTheta.toFixed(2)));
    setNextDifficultyB(parseFloat(idealDiff.toFixed(2)));

    const newSignals = [];
    if (hesitationSeconds > 8) newSignals.push(`Hesitation noted (${hesitationSeconds}s)`);
    if (retryCount > 0) newSignals.push(`Option shifts detected (${retryCount}x)`);
    if (hintCount > 0) newSignals.push(`Scaffolding hints utilized`);
    if (newSignals.length === 0) newSignals.push('Optimal response pace & immediate recall');
    setWhySignals(newSignals);
    const updatedStoreData = recordAttempt(attempt);
    processLearningOutcome(
      {
        conceptId: attempt.conceptId,
        itemId: attempt.id,
        itemHash: attempt.itemHash,
        correct: attempt.isCorrect,
        confidence: attempt.confidence,
        source: 'QUEST',
        timestamp: attempt.timestamp,
        sessionId: session.conceptId,
        attemptId: attempt.id,
      },
      updatedStoreData
    );

    const nextAttempts = [...session.attempts, attempt];
    const updatedSession = { ...session, attempts: nextAttempts };
    setSession(updatedSession);

    if (!session.isSolo && typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    }
  };

  const handleNextItem = () => {
    if (!session) return;

    if (session.currentIndex + 1 >= session.totalLength) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      const currentConceptName = session.items[session.currentIndex]?.conceptName || 'Core Concept';
      clearActiveSession(currentConceptName);

      const targetConcept = conceptParam || session.conceptId || session.items[0]?.conceptId;
      router.push(`/session-summary?concept=${encodeURIComponent(targetConcept || '')}&mode=${session.isSolo ? 'solo' : 'assisted'}`);
      return;
    }

    const nextIndex = session.currentIndex + 1;
    const nextItem = session.items[nextIndex];
    const nextSession: SessionState = {
      ...session,
      currentIndex: nextIndex,
    };

    setSession(nextSession);
    setSelectedOption(null);
    setUserConfidence(null);
    setIsSubmitted(false);
    setShowHint(false);
    setHesitationSeconds(0);

    if (!session.isSolo && nextItem) {
      saveActiveSession({
        conceptId: session.conceptId || nextItem.conceptId,
        conceptName: nextItem.conceptName || 'Core Concept',
        currentIndex: nextIndex,
        totalLength: session.totalLength,
        completedItemIds: nextSession.attempts.map((a) => a.id),
        updatedAt: Date.now(),
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      }
    }
  };

  const handleExperienceComplete = (evidence: any) => {
    const currentItem = session?.items[session.currentIndex];
    if (!currentItem || !session) return;

    // Handle Molecule Builder experience completion
    if (currentItem.experienceType === 'MOLECULE_BUILDER') {
      const isAlreadyResult = Boolean(evidence && evidence.experienceId && evidence.summaryFeedback);
      const outcomePayload = {
        conceptId: currentItem.conceptId || 'molecular_bonding',
        conceptName: currentItem.conceptName || 'Molecular Bonding: Water (H₂O)',
        isSuccess: true,
        accuracy: 1.0,
        trialsCount: evidence.trialsCount || 2,
        confidence: 'known' as const,
        timeSpentSeconds: evidence.timeSpentSeconds || 30,
        timestamp: Date.now(),
      };

      const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome(outcomePayload);
      setExperienceNextAction(nextAction);

      const structuredResult: ExperienceResult = isAlreadyResult
        ? evidence
        : createMoleculeExperienceResult(
            MOLECULE_BUILDER_EXPERIENCE,
            {
              experienceId: MOLECULE_BUILDER_EXPERIENCE.id,
              conceptId: 'molecular_bonding',
              conceptName: 'Molecular Bonding: Water (H₂O)',
              totalAttempts: 1,
              successfulAttempts: 1,
              hasSucceeded: true,
              totalTrials: 1,
              successfulTrials: 1,
              targetHits: 1,
              totalInteractions: evidence.totalInteractions || 6,
              predictionAccuracy: 1.0,
              hintsRequested: 0,
              trials: [],
              angleHistory: [],
              velocityHistory: [],
              errorHistory: [],
              patternSummary: 'Water molecule assembled',
              detectedPrinciple: 'molecule_complete',
              principlesIdentified: ['molecule_complete'],
            },
            [
              { id: 'o1-h1', fromAtomId: 'o1', toAtomId: 'h1' },
              { id: 'o1-h2', fromAtomId: 'o1', toAtomId: 'h2' },
            ],
            true,
            0,
            outcomePayload.timeSpentSeconds
          );

      setExperienceResult(structuredResult);
      const adaptiveLoopResult = processAdaptiveExperienceLoop(structuredResult);
      setAdaptiveResult(adaptiveLoopResult);
      setExperienceNextAction(adaptiveLoopResult.decision);

      const nextAttempts = [...session.attempts, attempt];
      const updatedSession = { ...session, attempts: nextAttempts };
      setSession(updatedSession);

      if (!session.isSolo && typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }

      setExperienceState('reflection');
      return;
    }

    // Handle Object Manipulation experience completion
    if (currentItem.experienceType === 'OBJECT_MANIPULATION') {
      const isAlreadyResult = Boolean(evidence && evidence.experienceId && evidence.summaryFeedback);
      const outcomePayload = {
        conceptId: currentItem.conceptId || 'spatial_reasoning',
        conceptName: currentItem.conceptName || "Scholar's Prism: 3D Spatial Orientation",
        isSuccess: true,
        accuracy: 1.0,
        trialsCount: evidence.trialsCount || 1,
        confidence: 'known' as const,
        timeSpentSeconds: evidence.timeSpentSeconds || 30,
        timestamp: Date.now(),
      };

      const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome(outcomePayload);
      setExperienceNextAction(nextAction);

      const structuredResult: ExperienceResult = isAlreadyResult
        ? evidence
        : createSpatialExperienceResult(
            OBJECT_MANIPULATION_EXPERIENCE,
            {
              experienceId: OBJECT_MANIPULATION_EXPERIENCE.id,
              conceptId: 'spatial_reasoning',
              conceptName: "Scholar's Prism: Harmonic Alignment",
              totalTrials: evidence.trialsCount || 1,
              successfulTrials: 1,
              targetHits: 1,
              totalInteractions: evidence.totalInteractions || 6,
              predictionAccuracy: 1.0,
              hintsRequested: 0,
              trials: [],
              principlesIdentified: ['spatial_aligned'],
            } as any,
            5.0,
            outcomePayload.timeSpentSeconds
          );

      setExperienceResult(structuredResult);
      const adaptiveLoopResult = processAdaptiveExperienceLoop(structuredResult);
      setAdaptiveResult(adaptiveLoopResult);
      setExperienceNextAction(adaptiveLoopResult.decision);

      const nextAttempts = [...session.attempts, attempt];
      const updatedSession = { ...session, attempts: nextAttempts };
      setSession(updatedSession);

      if (!session.isSolo && typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }

      setExperienceState('reflection');
      return;
    }

    // Handle Heart Anatomy Explorer experience completion
    if (currentItem.experienceType === 'HEART_ANATOMY_EXPLORER') {
      const isAlreadyResult = Boolean(evidence && evidence.experienceId && evidence.summaryFeedback);
      const outcomePayload = {
        conceptId: currentItem.conceptId || 'human_heart_anatomy',
        conceptName: currentItem.conceptName || '3D Human Heart Anatomy: Chambers, Valves & Circulation',
        isSuccess: true,
        accuracy: 1.0,
        trialsCount: evidence.trialsCount || 1,
        confidence: 'known' as const,
        timeSpentSeconds: evidence.timeSpentSeconds || 45,
        timestamp: Date.now(),
      };

      const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome(outcomePayload);
      setExperienceNextAction(nextAction);

      const structuredResult: ExperienceResult = isAlreadyResult
        ? evidence
        : createHeartExperienceResult(
            HEART_ANATOMY_EXPERIENCE,
            {
              experienceId: HEART_ANATOMY_EXPERIENCE.id,
              conceptId: 'human_heart_anatomy',
              conceptName: '3D Human Heart Anatomy: Chambers, Valves & Circulation',
              totalAttempts: 1,
              successfulAttempts: 1,
              hasSucceeded: true,
              totalTrials: 1,
              successfulTrials: 1,
              targetHits: 1,
              totalInteractions: evidence.totalInteractions || 8,
              predictionAccuracy: 1.0,
              hintsRequested: 0,
              trials: [],
              angleHistory: [],
              velocityHistory: [],
              errorHistory: [],
              patternSummary: 'Heart anatomy explored and blood flow verified.',
              detectedPrinciple: 'anatomy_mastered',
              principlesIdentified: ['anatomy_mastered', 'flow_sequence_verified'],
            },
            {
              currentEulerDeg: [0, 0, 0],
              selectedStructureId: 'left_ventricle',
              inspectedStructures: ['left_ventricle', 'right_ventricle', 'aorta', 'mitral_valve'],
              flowStepIndex: 12,
              isFlowActive: false,
              flowErrors: 0,
              flowCompleted: true,
              currentChallengeIndex: 1,
              challengeAnswers: {
                ch_systemic_pump: { selectedId: 'left_ventricle', isCorrect: true },
              },
              isComplete: true,
            },
            outcomePayload.timeSpentSeconds
          );

      setExperienceResult(structuredResult);
      const adaptiveLoopResult = processAdaptiveExperienceLoop(structuredResult);
      setAdaptiveResult(adaptiveLoopResult);
      setExperienceNextAction(adaptiveLoopResult.decision);

      const nextAttempts = [...session.attempts, attempt];
      const updatedSession = { ...session, attempts: nextAttempts };
      setSession(updatedSession);

      if (!session.isSolo && typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }

      setExperienceState('reflection');
      return;
    }

    // Handle Code Debugging experience completion
    if (currentItem.experienceType === 'CODE_DEBUGGING') {
      const isAlreadyResult = Boolean(evidence && evidence.experienceId && evidence.summaryFeedback);
      const outcomePayload = {
        conceptId: currentItem.conceptId || 'python_debugging_basics',
        conceptName: currentItem.conceptName || 'Python Debugging: Accumulation vs Reassignment',
        isSuccess: true,
        accuracy: 1.0,
        trialsCount: evidence.trialsCount || 1,
        confidence: 'known' as const,
        timeSpentSeconds: evidence.timeSpentSeconds || 40,
        timestamp: Date.now(),
      };

      const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome(outcomePayload);
      setExperienceNextAction(nextAction);

      const structuredResult: ExperienceResult = isAlreadyResult
        ? evidence
        : createCodeExperienceResult(
            CODE_DEBUGGING_EXPERIENCE,
            {
              experienceId: CODE_DEBUGGING_EXPERIENCE.id,
              conceptId: 'python_debugging_basics',
              conceptName: 'Python Debugging: Accumulation vs Reassignment',
              totalAttempts: 1,
              successfulAttempts: 1,
              hasSucceeded: true,
              totalTrials: evidence.trialsCount || 1,
              successfulTrials: 1,
              targetHits: 1,
              totalInteractions: evidence.totalInteractions || 5,
              predictionAccuracy: 1.0,
              hintsRequested: 0,
              trials: [],
              angleHistory: [],
              velocityHistory: [],
              errorHistory: [],
              patternSummary: 'Accumulation bug resolved',
              detectedPrinciple: 'code_debugged_successfully',
              principlesIdentified: ['accumulation_operator_corrected'],
            },
            {
              sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)',
              lastOutput: '20',
              runCount: 1,
              editCount: 1,
              hasRun: true,
              isCompleted: true,
              hintsUsed: 0,
              consecutiveMismatches: 0,
              independentCompletion: true,
              history: [],
            },
            outcomePayload.timeSpentSeconds
          );

      setExperienceResult(structuredResult);
      const adaptiveLoopResult = processAdaptiveExperienceLoop(structuredResult);
      setAdaptiveResult(adaptiveLoopResult);
      setExperienceNextAction(adaptiveLoopResult.decision);

      const nextAttempts = [...session.attempts, attempt];
      const updatedSession = { ...session, attempts: nextAttempts };
      setSession(updatedSession);

      if (!session.isSolo && typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }

      setExperienceState('reflection');
      return;
    }

    // 1. Record evidence in canonical store and feedback loop
    const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome(evidence);
    setExperienceNextAction(nextAction);

    // 2. Build structured ExperienceResult
    const structuredResult = createExperienceResultFromTelemetry(
      PROJECTILE_MOTION_EXPERIENCE,
      {
        experienceId: PROJECTILE_MOTION_EXPERIENCE.id,
        conceptId: currentItem.conceptId,
        conceptName: currentItem.conceptName || 'Projectile Motion',
        totalAttempts: evidence.trialsCount || 1,
        successfulAttempts: evidence.isSuccess ? 1 : 0,
        hasSucceeded: evidence.isSuccess,
        predictionAccuracy: evidence.accuracy || 1.0,
        trials: [],
        angleHistory: [25, 45],
        velocityHistory: [18, 18],
        errorHistory: [0],
        hintsRequested: 0,
        patternSummary: 'Mastered projectile motion trajectory.',
        detectedPrinciple: 'mastered',
      },
      {
        points: [],
        flightTime: 2.0,
        peakHeight: 3.5,
        peakTime: 1.0,
        landingDistance: 25.0,
        targetDistance: 25.0,
        targetError: 0,
        isHit: true,
        impactVelocity: 18.5,
        initialVx: 16.5,
        initialVy: 7.0,
      },
      evidence.timeSpentSeconds || 30
    );

    setExperienceResult(structuredResult);
    const adaptiveLoopResult = processAdaptiveExperienceLoop(structuredResult);
    setAdaptiveResult(adaptiveLoopResult);
    setExperienceNextAction(adaptiveLoopResult.decision);

    // 3. Update session attempts
    const nextAttempts = [...session.attempts, attempt];
    const updatedSession = { ...session, attempts: nextAttempts };
    setSession(updatedSession);

    if (!session.isSolo && typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    }

    // 4. Transition to reflection view
    setExperienceState('reflection');
  };

  const handleExperienceContinue = (targetRoute?: string) => {
    const route = targetRoute || adaptiveResult?.nextQuest?.route;

    // Emit telemetry for adaptive route transition
    if (currentItem?.conceptId && route) {
      try {
        const emitter = new TelemetryEmitter(
          (currentItem as any).experienceId || 'quest',
          currentItem.conceptId,
          currentItem.conceptName || 'Concept'
        );
        emitter.emit('adaptive_route_clicked', {
          conceptId: currentItem.conceptId,
          targetRoute: route,
          action: adaptiveResult?.decision?.action,
          questId: adaptiveResult?.nextQuest?.questId,
        });
      } catch (e) {
        // Telemetry safe fallback
      }
    }

    // If a valid targetRoute is provided and differs from the current URL, route to it
    if (route) {
      const currentUrl = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '';
      if (route !== currentUrl) {
        // Clear reflection state before routing
        setExperienceState('briefing');
        setExperienceResult(null);
        router.push(route);
        return;
      }
    }

    // Default in-place progression
    setExperienceState('briefing');
    setExperienceResult(null);
    handleNextItem();
  };

  if (isExhausted) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-panel border border-line rounded-[20px] p-8 text-center space-y-6 shadow-2xl">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              CONCEPT POOL COMPLETED
            </span>
            <h1 className="font-sans font-bold text-xl text-text">Item Bank Exhausted</h1>
            <p className="font-sans text-xs text-muted leading-relaxed">
              You have completed all generated questions for this concept!
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={isRegenerating}
              onClick={handleRegeneratePool}
              className="w-full h-11 rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isRegenerating ? 'Generating fresh questions...' : 'Generate New Item Bank'}</span>
              <span>&rarr;</span>
            </button>
            <Link
              href="/home"
              className="w-full h-10 rounded-[12px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center transition-colors block text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showSoloPreScreen && isSoloRequested) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-[#141826] border border-violet/40 rounded-[20px] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-violet/20 border border-violet flex items-center justify-center text-violet-400 font-mono text-xl mx-auto">
            🛡️
          </div>
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-violet font-bold tracking-eyebrow">
              OFFICIAL ASSESSMENT MODE
            </span>
            <h1 className="font-sans font-bold text-xl text-text">Solo Mode</h1>
            <p className="font-sans text-xs text-muted leading-relaxed">
              6 items without hints, mid-session feedback, or AI assistance.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setShowSoloPreScreen(false)}
              className="w-full h-11 rounded-[12px] bg-violet hover:bg-violet-hot text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Begin Assessment</span>
              <span>&rarr;</span>
            </button>
            <Link
              href="/home"
              className="w-full h-10 rounded-[12px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center transition-colors block text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !session.items[session.currentIndex]) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 font-mono text-sm text-cyan animate-pulse">
        Initializing adaptive quest...
      </div>
    );
  }

  const currentItem = session.items[session.currentIndex];
  const isLastItem = session.currentIndex + 1 >= session.totalLength;

  if (isArenaMode) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#0B0D14] via-[#0B0D14] to-[#0B0D14] text-text flex flex-col justify-between select-none relative font-sans">
        {/* Arena Top Navigation Header */}
        <header className="h-14 px-4 sm:px-6 bg-[#141826]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/world" className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white">
              <span>&larr;</span>
              <span>Learning Base</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold">
              🔥 LEARN OR LOSE SURVIVOR
            </span>
            <button
              onClick={() => setIsArenaMode(false)}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono"
            >
              Standard Mode
            </button>
          </div>
        </header>

        {/* Main Arena View */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
          <LearnOrLoseArena
            questions={session.items}
            conceptTitle={currentItem?.conceptName || 'Sector Defense'}
            onExit={() => router.push('/world')}
          />
        </div>
      </div>
    );
  }

  // Unified Experiential Learning View (resolved via ExperienceRegistry)
  const experienceDef = currentItem?.experienceType
    ? experienceRegistry.getExperienceDefinition(currentItem.experienceType)
    : undefined;

  if (currentItem?.experienceType && (experienceDef || ['PROJECTILE_SIMULATION', 'OBJECT_MANIPULATION', 'MOLECULE_BUILDER', 'HEART_ANATOMY_EXPLORER', 'CODE_DEBUGGING'].includes(currentItem.experienceType))) {
    const template = experienceDef?.template || 'custom';
    const badgeLabel =
      template === 'simulation' ? '3D SIMULATION' :
      template === 'manipulation' ? (currentItem.experienceType === 'HEART_ANATOMY_EXPLORER' ? '3D ANATOMY' : '3D SPATIAL') :
      template === 'builder' ? '3D MOLECULE' :
      template === 'code' ? 'CODE LAB' : '3D EXPERIENCE';
    const badgeColor =
      template === 'simulation' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' :
      template === 'manipulation' ? (currentItem.experienceType === 'HEART_ANATOMY_EXPLORER' ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300') :
      template === 'builder' ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' :
      template === 'code' ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' :
      'bg-purple-500/15 border-purple-500/30 text-purple-300';

    return (
      <div className="min-h-[100dvh] bg-ink text-text flex flex-col justify-between select-none relative font-sans">
        {/* Top Header Strip */}
        <header className="h-12 px-4 bg-ink border-b border-line/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/home" className="text-muted hover:text-text font-mono text-sm">
              &larr;
            </Link>
            <span className="font-mono text-xs text-muted">
              Quest {session.currentIndex + 1} of {session.totalLength}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-xs text-text truncate max-w-[140px] sm:max-w-[200px]">
              {currentItem.conceptName || experienceDef?.title || 'Interactive Experience'}
            </span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${badgeColor}`}>
              {badgeLabel}
            </span>
          </div>
        </header>

        {/* Main Experience Flow Area */}
        <main className="flex-1 min-h-0 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4 flex flex-col justify-center overflow-y-auto">
          {experienceState === 'briefing' && (
            <QuestBriefingCard
              quest={currentItem}
              onEnterExperience={() => setExperienceState('interactive')}
            />
          )}

          {experienceState === 'interactive' && (
            <>
              {currentItem.experienceType === 'PROJECTILE_SIMULATION' && (
                <ExperienceContainer
                  config={(currentItem as any).experienceConfig || PROJECTILE_MOTION_EXPERIENCE}
                  onComplete={handleExperienceComplete}
                  backHref="/home"
                />
              )}
              {currentItem.experienceType === 'OBJECT_MANIPULATION' && (
                <ObjectExperienceContainer
                  config={(currentItem as any).experienceConfig || OBJECT_MANIPULATION_EXPERIENCE}
                  onComplete={handleExperienceComplete}
                  backHref="/home"
                />
              )}
              {currentItem.experienceType === 'MOLECULE_BUILDER' && (
                <MoleculeExperienceContainer
                  config={(currentItem as any).experienceConfig || MOLECULE_BUILDER_EXPERIENCE}
                  onComplete={handleExperienceComplete}
                  backHref="/home"
                />
              )}
              {currentItem.experienceType === 'HEART_ANATOMY_EXPLORER' && (
                <HeartExperienceContainer
                  config={(currentItem as any).experienceConfig || HEART_ANATOMY_EXPERIENCE}
                  onComplete={handleExperienceComplete}
                  backHref="/home"
                />
              )}
              {currentItem.experienceType === 'CODE_DEBUGGING' && (
                <CodeExperienceContainer
                  config={(currentItem as any).experienceConfig || CODE_DEBUGGING_EXPERIENCE}
                  onComplete={handleExperienceComplete}
                  backHref="/home"
                />
              )}
            </>
          )}

          {experienceState === 'reflection' && experienceResult && (
            <ExperienceReflectionCard
              result={experienceResult}
              onContinue={handleExperienceContinue}
              nextActionReason={adaptiveResult?.reason || experienceNextAction?.reason}
              nextActionTitle={experienceNextAction ? formatActionTitle(experienceNextAction) : 'Continue Learning Pathway'}
              adaptiveResult={adaptiveResult}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-ink text-text flex flex-col justify-between select-none relative font-sans">
      
      {/* Top Header Strip */}
      <header className="h-12 px-4 bg-ink border-b border-line flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/home" className="text-muted hover:text-text font-mono text-sm">
            &larr;
          </Link>
          <span className="font-mono text-xs text-muted">
            Question {session.currentIndex + 1} of {session.totalLength}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsArenaMode(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-[11px] font-mono font-bold hover:bg-[#38BDF8]/20 transition-all"
          >
            <Zap className="w-3 h-3" />
            <span>Arena Mode</span>
          </button>
          <span className="font-sans font-semibold text-xs text-text truncate max-w-[140px] sm:max-w-[200px]">
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

        {/* Question Card */}
        <div className="bg-panel border border-line/60 rounded-[18px] p-4 sm:p-5 space-y-4 shadow-2xl my-auto">
          
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              {session.isSolo ? 'SOLO EVALUATION ITEM' : 'ADAPTIVE ITEM'}
            </span>
            <h1 className="font-sans font-bold text-sm sm:text-base text-text leading-snug">
              {currentItem.prompt}
            </h1>
          </div>

          {/* CONFIDENCE CHECK PRE-STEP (Only in Assisted Mode) */}
          {!session.isSolo && userConfidence === null ? (
            <div className="py-6 px-4 rounded-[14px] bg-raised/50 border border-line/80 text-center space-y-4 animate-fadeIn">
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
                  <span>✓</span>
                  <span>I know this</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserConfidence('unsure')}
                  className="h-[44px] px-3 rounded-[12px] bg-raised border border-line hover:border-muted text-text font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-raised/80 active:scale-98"
                >
                  <span>?</span>
                  <span>Not sure</span>
                </button>
              </div>
            </div>
          ) : (
            /* OPTIONS */
            <div className="space-y-2 sm:space-y-3 animate-fadeIn">
              {currentItem.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === (currentItem.correctIndex ?? currentItem.answerIndex ?? 0);

                let optionStyle = 'bg-[#141826]/85 border-white/[0.09] hover:border-cyan text-text';

                if (isSubmitted) {
                  if (session.isSolo) {
                    optionStyle = isSelected
                      ? 'bg-violet-600/30 border-violet text-text font-semibold'
                      : 'bg-[#141826]/40 border-transparent text-muted/50';
                  } else {
                    if (isCorrect) {
                      optionStyle = 'bg-success/15 border-success text-success font-semibold';
                    } else if (isSelected) {
                      optionStyle = 'bg-danger/15 border-danger text-danger font-semibold';
                    } else {
                      optionStyle = 'bg-[#141826]/40 border-transparent text-muted/50';
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

          {/* Explanation Banner */}
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

          {/* Scaffolding Hint */}
          {!session.isSolo && showHint && (
            <div className="p-3.5 rounded-[12px] bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans animate-fadeIn">
              💡 <strong>Hint:</strong> Focus on the primary metabolic output or key mechanism involved.
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
                🛡️ Solo (No Assistance)
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
                <span>&rarr;</span>
              </button>
            )}
          </div>

        </div>

      </main>

      {/* 3. ASK XYRA FLOATING BUTTON (Visible in Assisted Quest Mode) */}
      {!session.isSolo && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            onClick={() => setIsAskXyraOpen(true)}
            className="h-11 px-4 rounded-full bg-[#141826] border border-[#38BDF8]/50 hover:border-[#38BDF8] text-[#38BDF8] font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:scale-105 transition-all cursor-pointer group backdrop-blur-md"
          >
            <div className="w-6 h-6 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8] flex items-center justify-center text-[10px] font-bold text-[#38BDF8] shadow-[0_0_8px_rgba(0,240,255,0.5)]">
              X
            </div>
            <span>Ask XYRA</span>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </button>
        </div>
      )}

      {/* ASK XYRA MODAL */}
      {isAskXyraOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141826] border border-[#38BDF8]/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#38BDF8]">
                <div className="w-5 h-5 rounded-full border border-[#38BDF8] bg-[#38BDF8]/20 text-[#38BDF8] font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                  X
                </div>
                <span>Ask XYRA</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAskXyraOpen(false);
                  setXyraResponse(null);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!xyraResponse ? (
              <div className="space-y-2 pt-1 font-sans text-xs">
                <button
                  type="button"
                  disabled={xyraLoading}
                  onClick={() => handleAskXyra('explain')}
                  className="w-full p-3 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>&ldquo;Explain this&rdquo;</span>
                  <span className="font-mono text-xs">&rarr;</span>
                </button>

                <button
                  type="button"
                  disabled={xyraLoading}
                  onClick={() => handleAskXyra('hint')}
                  className="w-full p-3 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>&ldquo;Give a hint&rdquo;</span>
                  <span className="font-mono text-xs">&rarr;</span>
                </button>

                <button
                  type="button"
                  disabled={xyraLoading}
                  onClick={() => handleAskXyra('lost')}
                  className="w-full p-3 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20 font-semibold text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>&ldquo;I&apos;m lost&rdquo;</span>
                  <span className="font-mono text-xs">&rarr;</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3.5 rounded-2xl bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-slate-100 text-xs font-sans space-y-2">
                  <div className="flex items-center justify-between border-b border-[#38BDF8]/20 pb-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#38BDF8] font-bold">
                      <span>XYRA says:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakXyra(xyraResponse)}
                      className="text-[10px] font-mono text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
                    </button>
                  </div>
                  <p className="leading-relaxed font-medium">{xyraResponse}</p>
                </div>

                <div className="flex items-center justify-between pt-1 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setXyraResponse(null)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                  >
                    &larr; Ask another question
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAskXyraOpen(false);
                      setXyraResponse(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#38BDF8] text-black font-bold hover:brightness-110 cursor-pointer transition-all"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
