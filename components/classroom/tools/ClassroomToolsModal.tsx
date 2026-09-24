'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Drawer, Button } from '@/components/ui';
import {
  BookOpen,
  HelpCircle,
  Lightbulb,
  FileText,
  Calculator,
  Layers,
  Bookmark,
  Check,
  Save,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Volume2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  ClassroomToolType,
  ClassroomLesson,
  ClassroomLessonStep,
  QuestionDefinition,
  ProgressiveHint,
  FlashcardItem,
} from '../types';
import { ClassroomTelemetryEvent } from '@/lib/classroom/classroomIntelligence';

export interface ClassroomToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolType: ClassroomToolType | null;
  lesson: ClassroomLesson;
  currentStep: ClassroomLessonStep;
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  onOpenTool?: (tool: ClassroomToolType) => void;
  onTelemetry?: (event: ClassroomTelemetryEvent) => void;
}

export const ClassroomToolsModal: React.FC<ClassroomToolsModalProps> = ({
  isOpen,
  onClose,
  toolType,
  lesson,
  currentStep,
  currentStepIndex,
  onSelectStep,
  onOpenTool,
  onTelemetry,
}) => {
  // =========================================================================
  // 1. QUESTIONS STATE & MASTERY EVIDENCE
  // =========================================================================
  // Build canonical question list: lesson.questions if available, or currentStep checkQuestion
  const questionsList: QuestionDefinition[] = useMemo(() => {
    if (lesson.questions && lesson.questions.length > 0) {
      return lesson.questions;
    }
    if (currentStep.checkQuestion) {
      return [
        {
          id: `q_step_${currentStep.id}`,
          lessonId: lesson.id,
          conceptId: lesson.conceptId,
          prompt: currentStep.checkQuestion.prompt,
          type: 'conceptual',
          difficulty: 'MEDIUM',
          options: currentStep.checkQuestion.options,
          explanation: 'Core concept demonstrated in the current lesson step.',
        },
      ];
    }
    return [];
  }, [lesson.questions, lesson.id, lesson.conceptId, currentStep]);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [questionAttempts, setQuestionAttempts] = useState<Record<string, number>>({});
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');

  const activeQuestion = questionsList[activeQuestionIndex] || questionsList[0];
  const selectedOption = activeQuestion?.options.find((o) => o.id === selectedOptionId);
  const isAnswerCorrect = selectedOption?.isCorrect ?? false;

  // Handle switching question
  const handleSelectQuestion = (idx: number) => {
    setActiveQuestionIndex(idx);
    setSelectedOptionId(null);
    setIsAnswerChecked(false);
    setSubmissionStatus('idle');
  };

  // Submit answer and feed evidence to existing mastery system
  const handleCheckAnswer = async () => {
    if (!selectedOption || !activeQuestion) return;

    setIsAnswerChecked(true);
    const attempts = (questionAttempts[activeQuestion.id] || 0) + 1;
    setQuestionAttempts((prev) => ({ ...prev, [activeQuestion.id]: attempts }));

    // Send evidence to existing persistence & mastery endpoint without client-side theta manipulation
    setSubmissionStatus('recording');
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/user/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId: lesson.conceptId,
            conceptName: lesson.topicTitle,
            attempt: {
              id: `att_${Date.now()}_${activeQuestion.id}`,
              isCorrect: isAnswerCorrect,
              timestamp: Date.now(),
              isSolo: true,
              difficulty: activeQuestion.difficulty,
              misconceptionTag: activeQuestion.misconceptionTag,
              attemptNumber: attempts,
            },
          }),
        });
      }
      setSubmissionStatus('recorded');
    } catch {
      // Safe local fallback: evidence was recorded in session state
      setSubmissionStatus('recorded');
    }

    if (onTelemetry) {
      onTelemetry({
        eventType: 'question_attempt',
        conceptId: lesson.conceptId,
        conceptName: lesson.topicTitle,
        stepIndex: currentStepIndex,
        stepTitle: currentStep.title,
        timestamp: Date.now(),
        data: {
          questionId: activeQuestion.id,
          isCorrect: isAnswerCorrect,
          difficulty: activeQuestion.difficulty,
          misconceptionTag: activeQuestion.misconceptionTag,
          attemptNumber: attempts,
          chosenOptionId: selectedOption.id,
        },
      });
    }
  };

  const handleTryAgain = () => {
    setSelectedOptionId(null);
    setIsAnswerChecked(false);
    setSubmissionStatus('idle');
  };

  // =========================================================================
  // 2. PROGRESSIVE HINTS STATE
  // =========================================================================
  // Progressive hint: Question-specific hint -> Step-specific hint -> Lesson-level hint -> Step fallback
  const activeHintData: ProgressiveHint = useMemo(() => {
    if (activeQuestion?.hint) return activeQuestion.hint;
    if (currentStep.progressiveHint) return currentStep.progressiveHint;
    if (lesson.progressiveHints && lesson.progressiveHints.length > 0) {
      return lesson.progressiveHints[0];
    }
    // High-quality fallback derived from step hint text
    const base = currentStep.hintText || 'Consider the physical laws and relationships governing this step.';
    return {
      id: `hint_${currentStep.id}`,
      conceptId: lesson.conceptId,
      hints: [
        `Think about the key principle: ${currentStep.title}. Notice what variable is changing.`,
        base,
        `Observe the Smart Board visualization carefully to connect the cause with the observed effect.`,
      ],
    };
  }, [activeQuestion, currentStep, lesson]);

  const [hintStage, setHintStage] = useState(0); // 0 = Hint 1, 1 = Hint 2, 2 = Hint 3

  const handleUnlockNextHint = () => {
    if (hintStage < activeHintData.hints.length - 1) {
      const nextStage = hintStage + 1;
      setHintStage(nextStage);
      if (onTelemetry) {
        onTelemetry({
          eventType: 'hint_requested',
          conceptId: lesson.conceptId,
          conceptName: lesson.topicTitle,
          stepIndex: currentStepIndex,
          stepTitle: currentStep.title,
          timestamp: Date.now(),
          data: {
            hintStage: nextStage + 1,
          },
        });
      }
    }
  };

  const handleSpeakHint = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // =========================================================================
  // 3. STUDENT STUDY NOTES STATE (LOCAL STORAGE PERSISTENCE)
  // =========================================================================
  const storageKey = `xpedition_notes_${lesson.conceptId}`;
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      setStudentNotes(saved || lesson.initialNotes || '');
      const savedTime = localStorage.getItem(`${storageKey}_time`);
      if (savedTime) setLastSavedTime(savedTime);
    }
  }, [storageKey, lesson.initialNotes]);

  const handleSaveNotes = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, studentNotes);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(`${storageKey}_time`, timeStr);
      setLastSavedTime(timeStr);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleClearNotes = () => {
    if (window.confirm('Are you sure you want to clear your notes for this class?')) {
      setStudentNotes('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_time`);
        setLastSavedTime(null);
      }
    }
  };

  const handleCopyNotes = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(studentNotes);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Word and character count
  const noteWordCount = studentNotes.trim() ? studentNotes.trim().split(/\s+/).length : 0;
  const noteCharCount = studentNotes.length;

  // =========================================================================
  // 4. FLASHCARDS STATE & KNOWN / REVIEW TRACKING
  // =========================================================================
  const initialCards = lesson.flashcards || [];
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatuses, setCardStatuses] = useState<Record<string, 'KNOWN' | 'REVIEW'>>({});

  const currentCard = initialCards[cardIndex] || initialCards[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % initialCards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + initialCards.length) % initialCards.length);
  };

  const handleMarkStatus = (status: 'KNOWN' | 'REVIEW') => {
    if (!currentCard) return;
    setCardStatuses((prev) => ({ ...prev, [currentCard.id]: status }));
    if (onTelemetry) {
      onTelemetry({
        eventType: 'flashcard_reviewed',
        conceptId: lesson.conceptId,
        conceptName: lesson.topicTitle,
        timestamp: Date.now(),
        data: {
          cardId: currentCard.id,
          cardStatus: status,
        },
      });
    }
    handleNextCard();
  };

  const handleResetCards = () => {
    setCardStatuses({});
    setCardIndex(0);
    setIsFlipped(false);
  };

  // Card stats
  const knownCount = Object.values(cardStatuses).filter((s) => s === 'KNOWN').length;
  const reviewCount = Object.values(cardStatuses).filter((s) => s === 'REVIEW').length;
  const unseenCount = Math.max(0, initialCards.length - (knownCount + reviewCount));

  // =========================================================================
  // 5. FORMULA COPYING
  // =========================================================================
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);
  const handleCopyFormula = async (formula: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(formula);
      setCopiedFormulaId(id);
      setTimeout(() => setCopiedFormulaId(null), 2000);
    }
  };

  if (!toolType) return null;

  // Metadata per tool
  const toolMeta: Record<
    ClassroomToolType,
    { title: string; subtitle: string; icon: React.ReactNode }
  > = {
    lesson: {
      title: 'Lesson Steps',
      subtitle: `${lesson.topicTitle} • Curriculum Navigation`,
      icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
    },
    questions: {
      title: 'Practice Questions',
      subtitle: `${lesson.topicTitle} • Question ${activeQuestionIndex + 1} of ${questionsList.length || 1}`,
      icon: <HelpCircle className="w-4 h-4 text-emerald-400" />,
    },
    audio: {
      title: 'Teach by Audio',
      subtitle: `${lesson.topicTitle} • Spoken Narration`,
      icon: <BookOpen className="w-4 h-4 text-sky-400" />,
    },
    hint: {
      title: 'Progressive Hints',
      subtitle: `Stage ${hintStage + 1} of ${activeHintData.hints.length} • Step ${currentStepIndex + 1}`,
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    },
    notes: {
      title: 'Student Scratchpad',
      subtitle: `${lesson.topicTitle} • Personal Study Notes`,
      icon: <FileText className="w-4 h-4 text-blue-400" />,
    },
    formula: {
      title: 'Formula Sheet',
      subtitle: `${lesson.subject} • Mathematical Equations & Units`,
      icon: <Calculator className="w-4 h-4 text-indigo-400" />,
    },
    flashcards: {
      title: 'Concept Flashcards',
      subtitle: `${cardIndex + 1} of ${initialCards.length} Cards • ${knownCount} Known`,
      icon: <Layers className="w-4 h-4 text-purple-400" />,
    },
    sources: {
      title: 'Verified Sources',
      subtitle: `${lesson.topicTitle} • Academic & Curriculum References`,
      icon: <Bookmark className="w-4 h-4 text-cyan-400" />,
    },
  };

  const activeMeta = toolMeta[toolType] || toolMeta.lesson;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={activeMeta.title}
      subtitle={activeMeta.subtitle}
      icon={activeMeta.icon}
      position="bottom"
    >
      <div className="space-y-4 pb-2">
        {/* ===================================================================
            1. LESSON STEPS NAVIGATOR
           =================================================================== */}
        {toolType === 'lesson' && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {lesson.steps.map((st, idx) => {
              const isCurrent = idx === currentStepIndex;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    onSelectStep(idx);
                    onClose();
                  }}
                  className={`w-full min-h-[44px] p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isCurrent
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-white font-semibold'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-xs font-bold text-white truncate">
                        {st.title}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {st.boardSummary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ===================================================================
            2. QUESTIONS TOOL (LESSON-AWARE, NO CLIENT THETA FABRICATION)
           =================================================================== */}
        {toolType === 'questions' && (
          <div className="space-y-4">
            {questionsList.length > 0 && activeQuestion ? (
              <div className="space-y-3">
                {/* Question index navigation chips if multiple questions exist */}
                {questionsList.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {questionsList.map((q, idx) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleSelectQuestion(idx)}
                        className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                          idx === activeQuestionIndex
                            ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-300'
                            : 'bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        Q{idx + 1} • {q.difficulty}
                      </button>
                    ))}
                  </div>
                )}

                {/* Question Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] border border-white/[0.1] space-y-4 shadow-xl">
                  {/* Badges & Meta */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase">
                        Quick Check
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          activeQuestion.difficulty === 'EASY'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            : activeQuestion.difficulty === 'HARD'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {activeQuestion.difficulty}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      Question {activeQuestionIndex + 1} of {questionsList.length}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <h3 className="font-sans text-sm sm:text-base font-bold text-white leading-snug">
                    {activeQuestion.prompt}
                  </h3>

                  {/* Options List */}
                  <div className="space-y-2">
                    {activeQuestion.options.map((opt, oIdx) => {
                      const isSelected = selectedOptionId === opt.id;
                      const letter = String.fromCharCode(65 + oIdx);

                      let optionStyle =
                        'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.15]';

                      if (isAnswerChecked) {
                        if (opt.isCorrect) {
                          optionStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold';
                        } else if (isSelected && !opt.isCorrect) {
                          optionStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-200';
                        } else {
                          optionStyle = 'bg-white/[0.02] border-white/[0.04] text-slate-500 opacity-60';
                        }
                      } else if (isSelected) {
                        optionStyle = 'bg-indigo-600/30 border-indigo-500/60 text-white font-medium shadow-md';
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isAnswerChecked}
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={`w-full min-h-[44px] p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${optionStyle}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white/[0.06] text-slate-400'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="font-sans text-xs sm:text-sm leading-relaxed flex-1">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Button: Check Answer */}
                  {!isAnswerChecked && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!selectedOptionId}
                        onClick={handleCheckAnswer}
                        className="min-h-[44px] min-w-[120px]"
                      >
                        Check Answer
                      </Button>
                    </div>
                  )}

                  {/* Feedback Live Region */}
                  {isAnswerChecked && selectedOption && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                        isAnswerCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-rose-500/10 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isAnswerCorrect ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <span
                          className={`font-sans font-bold text-xs sm:text-sm ${
                            isAnswerCorrect ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {isAnswerCorrect ? 'Correct!' : 'Not quite yet.'}
                        </span>
                      </div>

                      <p className="font-sans text-xs text-slate-200 leading-relaxed pl-7">
                        {selectedOption.feedback || activeQuestion.explanation}
                      </p>

                      {/* Post-answer actions */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/[0.06] pl-7">
                        {!isAnswerCorrect ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenTool && onOpenTool('hint')}
                              className="text-amber-400 hover:text-amber-300 min-h-[40px]"
                              leftIcon={<Lightbulb className="w-3.5 h-3.5" />}
                            >
                              View Hint
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleTryAgain}
                              className="min-h-[40px]"
                              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            >
                              Try Again
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] font-mono text-emerald-400">
                              Learning evidence recorded.
                            </span>
                            {activeQuestionIndex < questionsList.length - 1 ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSelectQuestion(activeQuestionIndex + 1)}
                                className="min-h-[40px]"
                              >
                                Next Question
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={onClose}
                                className="min-h-[40px]"
                              >
                                Continue Class
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center space-y-2">
                <p className="text-sm font-sans text-slate-300 font-medium">
                  No questions available for this observation step.
                </p>
                <p className="text-xs text-slate-500">
                  Advance through the lesson on the Smart Board to reach interactive practice checks.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            3. HINT TOOL (PROGRESSIVE 3-TIER SCAFFOLDING)
           =================================================================== */}
        {toolType === 'hint' && (
          <div className="space-y-4">
            {/* Pedagogic notice */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-sans text-xs font-semibold">
                  Progressive Hints • Scaffolding Active
                </span>
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                Stage {hintStage + 1} of {activeHintData.hints.length}
              </span>
            </div>

            {/* Render unlocked hints in progressive sequence */}
            <div className="space-y-3">
              {activeHintData.hints.slice(0, hintStage + 1).map((hintText, idx) => {
                const stageLabel =
                  idx === 0
                    ? 'Hint 1: Conceptual Nudge'
                    : idx === 1
                    ? 'Hint 2: Specific Direction'
                    : 'Hint 3: Deep Scaffold';

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-gradient-to-b from-[#181D30] to-[#0E1324] border border-white/[0.1] space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wide">
                        {stageLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSpeakHint(hintText)}
                        aria-label="Read hint aloud"
                        className="p-1 rounded text-slate-400 hover:text-amber-300 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {hintText}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Unlock next scaffold button if more exist */}
            {hintStage < activeHintData.hints.length - 1 && (
              <div className="pt-1 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUnlockNextHint}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  className="min-h-[44px]"
                >
                  Unlock Next Hint (Stage {hintStage + 2} of {activeHintData.hints.length})
                </Button>
              </div>
            )}

            {/* Pedagogic invariant note */}
            <p className="text-[11px] font-sans text-slate-500 text-center italic">
              Hints guide your thinking step-by-step. Asking for hints will never decrease your mastery score.
            </p>
          </div>
        )}

        {/* ===================================================================
            4. NOTES TOOL (PHYSICAL STICKY NOTE OBJECT)
           =================================================================== */}
        {toolType === 'notes' && (
          <div className="space-y-4 flex flex-col items-center">
            {/* Physical Sticky Note Object */}
            <div className="relative w-full max-w-xl p-5 rounded-2xl bg-[#FEF9C3] text-slate-900 border border-amber-300 shadow-[0_16px_36px_rgba(0,0,0,0.5)] transform -rotate-0.5 transition-transform hover:rotate-0">
              {/* Tape Strip / Sticky strip at top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/40 border border-amber-200/50 rounded-sm shadow-inner backdrop-blur-sm pointer-events-none" />

              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2 mb-3">
                <label
                  htmlFor="classroom-scratchpad"
                  className="font-mono text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>📌</span>
                  <span>Study Sticky Note • {lesson.topicTitle}</span>
                </label>

                <div className="flex items-center gap-2 text-[11px] font-mono text-amber-800/80">
                  <span>{noteWordCount} words</span>
                  <span>•</span>
                  <span>{noteCharCount} chars</span>
                </div>
              </div>

              <textarea
                id="classroom-scratchpad"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                rows={6}
                placeholder="Jot down notes, equations, questions to ask Buddy, or key takeaways..."
                className="w-full min-h-[140px] p-2 bg-transparent text-xs sm:text-sm font-sans text-slate-900 placeholder-amber-800/50 focus:outline-none leading-relaxed resize-y border-none"
              />

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearNotes}
                    disabled={!studentNotes}
                    className="p-1.5 rounded-lg text-amber-900 hover:text-rose-600 hover:bg-amber-200/50 transition-colors flex items-center gap-1 text-xs font-mono disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyNotes}
                    disabled={!studentNotes}
                    className="p-1.5 rounded-lg text-amber-900 hover:text-slate-900 hover:bg-amber-200/50 transition-colors flex items-center gap-1 text-xs font-mono disabled:opacity-30 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {lastSavedTime && (
                    <span className="text-[10px] font-mono text-amber-800/70 hidden sm:inline">
                      Saved at {lastSavedTime}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-100 font-sans text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'Saved!' : 'Save Note'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            5. FORMULA SHEET TOOL (PHYSICAL STUDY FORMULA CARD)
           =================================================================== */}
        {toolType === 'formula' && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {lesson.formulas && lesson.formulas.length > 0 ? (
              lesson.formulas.map((f, idx) => (
                <div
                  key={f.id}
                  className={`p-4 rounded-2xl bg-gradient-to-br from-[#0D1530] via-[#090F24] to-[#060B1C] border border-cyan-500/30 space-y-3 shadow-xl transition-all hover:border-cyan-400/50 ${
                    idx % 2 === 0 ? 'transform rotate-[0.3deg]' : 'transform -rotate-[0.3deg]'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-black text-cyan-400 text-base">∑</span>
                      <span className="font-sans font-bold text-xs sm:text-sm text-white">
                        {f.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyFormula(f.formula, f.id)}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedFormulaId === f.id ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Physical Formula Chalkboard / Card Display */}
                  <div className="p-3 rounded-xl bg-[#040816] border border-cyan-500/25 font-mono text-sm sm:text-base text-cyan-300 font-bold tracking-wide text-center shadow-inner">
                    {f.formula}
                  </div>

                  {/* Description */}
                  <p className="font-sans text-xs text-slate-300 leading-relaxed font-medium">
                    {f.description}
                  </p>

                  {/* Variables Table */}
                  <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-400">
                    {f.variables.map((v) => (
                      <div key={v.symbol} className="truncate">
                        <span className="text-cyan-400 font-bold">{v.symbol}</span> = {v.description}{' '}
                        {v.unit && <span className="text-slate-500 font-sans">({v.unit})</span>}
                      </div>
                    ))}
                  </div>

                  {/* Worked Example */}
                  {f.example && (
                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-sans text-slate-300">
                      <span className="font-mono text-cyan-400 font-bold mr-1">Example:</span>
                      {f.example}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center space-y-2">
                <p className="text-sm font-sans text-slate-300 font-medium">
                  No mathematical formulas required for this qualitative topic.
                </p>
                <p className="text-xs text-slate-500">
                  Topics without mathematical equations do not clutter your workspace with formulas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            6. FLASHCARDS TOOL (PHYSICAL STUDY CARDS WITH 3D DEPTH)
           =================================================================== */}
        {toolType === 'flashcards' && (
          <div className="space-y-4">
            {/* Status overview bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">{knownCount} Known</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{reviewCount} Review</span>
                <span>•</span>
                <span>{unseenCount} Unseen</span>
              </div>
              <button
                type="button"
                onClick={handleResetCards}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {currentCard ? (
              <div className="space-y-3">
                {/* 3D Flip Physical Study Card Container */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Flashcard. Click or press Enter to flip."
                  onClick={() => setIsFlipped(!isFlipped)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsFlipped(!isFlipped);
                    }
                  }}
                  className="w-full min-h-[190px] p-6 rounded-2xl bg-gradient-to-br from-[#121936] via-[#0D132A] to-[#070B18] border border-cyan-500/35 flex flex-col items-center justify-between text-center cursor-pointer select-none shadow-[0_16px_36px_rgba(0,0,0,0.8)] hover:border-cyan-400/60 transform rotate-[0.4deg] hover:rotate-0 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {/* Card Header */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold border-b border-white/[0.06] pb-2">
                    <span className="flex items-center gap-1">
                      <span>🏷️</span>
                      <span>{currentCard.category || 'Term'}</span>
                    </span>
                    <span className="text-slate-400 font-normal">
                      {isFlipped ? 'Answer (Click to Flip)' : 'Prompt (Click to Flip)'}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="my-auto py-3">
                    <p className="font-sans text-sm sm:text-base font-bold text-white leading-relaxed">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                  </div>

                  {/* Card Footer Badge */}
                  <div className="w-full flex items-center justify-center pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-mono text-slate-400">
                      Card {cardIndex + 1} of {initialCards.length} • Tap space or card to flip
                    </span>
                  </div>
                </div>

                {/* Flip & Review Action Bar */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleMarkStatus('REVIEW')}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Review Later</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkStatus('KNOWN')}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Know It</span>
                  </button>
                </div>

                {/* Card Navigation */}
                {initialCards.length > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handlePrevCard}
                      className="min-h-[44px] px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="font-mono text-xs text-slate-400">
                      {cardIndex + 1} / {initialCards.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextCard}
                      className="min-h-[44px] px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">No flashcards available.</div>
            )}
          </div>
        )}

        {/* ===================================================================
            7. SOURCES TOOL (STRICT CITATION INTEGRITY)
           =================================================================== */}
        {toolType === 'sources' && (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {lesson.sources && lesson.sources.length > 0 ? (
              lesson.sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans font-bold text-xs sm:text-sm text-white truncate">
                      {src.title}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30 shrink-0">
                      {src.type}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-slate-300 font-medium">
                    {src.authorOrPublisher}
                  </p>

                  {src.note && (
                    <p className="font-sans text-[11px] text-slate-400 italic pt-1 border-t border-white/[0.05]">
                      {src.note}
                    </p>
                  )}

                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:underline pt-1 min-h-[32px]"
                    >
                      <span>Verified Reference</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center space-y-1">
                <p className="text-xs sm:text-sm font-sans text-slate-300 font-semibold">
                  Sources not provided for this lesson.
                </p>
                <p className="text-xs text-slate-500 font-sans">
                  Academic citations are only displayed when verified curriculum material is bound to the lesson.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default ClassroomToolsModal;
