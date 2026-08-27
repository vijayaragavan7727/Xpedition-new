'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getStoreData, saveStoreData, recordAttempt, computeItemHash, UserStoreData } from '@/lib/store';

interface LessonChunk {
  say: string;
  code?: string;
}

interface LessonCheckpoint {
  ask: string;
  options: string[];
  answerIndex: number;
  why: string;
}

interface LessonData {
  chunks: LessonChunk[];
  checkpoint: LessonCheckpoint;
}

export type TutorState = 'idle' | 'talking' | 'thinking' | 'happy';

export default function TutorPage() {
  const router = useRouter();
  const params = useParams();
  const conceptId = (params?.conceptId as string) || 'c_1';

  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [conceptName, setConceptName] = useState<string>('Core Concept');
  const [conceptSummary, setConceptSummary] = useState<string>('');
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lesson Progression State
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [revealedWordCount, setRevealedWordCount] = useState<number>(0);
  const [isChunkComplete, setIsChunkComplete] = useState<boolean>(false);
  const [showCheckpoint, setShowCheckpoint] = useState<boolean>(false);
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Checkpoint State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Classroom UI State
  const [accumulatedNotes, setAccumulatedNotes] = useState<string[]>([]);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState<boolean>(false);
  const [showRaiseHandNotice, setShowRaiseHandNotice] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState<boolean>(false);
  const [learnerNotes, setLearnerNotes] = useState<string>('');
  const [robotImgPath, setRobotImgPath] = useState<string>('/robot.png');

  // Timers & Audio Ref
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const searchParams = useSearchParams();
  const queryParam = searchParams?.get('q') || '';
  const isQuickLearnMode = conceptId === 'quick' || Boolean(queryParam);

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);

    const activeGraph = store.graphs?.find((g) => g.id === store.activeGraphId) || store.graphs?.[0];
    const concept = activeGraph?.concepts?.find((c) => c.id === conceptId);

    if (activeGraph?.learnerProfile?.voiceMuted !== undefined) {
      setIsMuted(activeGraph.learnerProfile.voiceMuted);
    } else if (store.learnerProfile?.voiceMuted !== undefined) {
      setIsMuted(store.learnerProfile.voiceMuted);
    }

    const cName = queryParam || concept?.name || store.goalText || 'Core Concept';
    const cSummary = (concept as any)?.summary || '';
    const lang = activeGraph?.learnerProfile?.language || store.learnerProfile?.language || 'english';
    const level = activeGraph?.learnerProfile?.startingLevel || store.learnerProfile?.startingLevel || 'Complete beginner';
    const mastery = concept?.masteryPercentage || 0;

    setConceptName(cName);
    setConceptSummary(cSummary);

    async function fetchLesson() {
      setLoading(true);
      try {
        const res = await fetch('/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId,
            conceptName: cName,
            conceptSummary: cSummary,
            language: lang,
            startingLevel: level,
            masteryPercentage: mastery,
            isQuickLearn: isQuickLearnMode,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.chunks) && data.chunks.length > 0) {
            setLesson(data);
          } else {
            setError('Unable to structure tutor lesson.');
          }
        } else {
          setError('Lesson engine offline.');
        }
      } catch (err) {
        setError('Network error fetching tutor lesson.');
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [conceptId, queryParam, isQuickLearnMode]);

  // Speech & Word Reveal Timer
  useEffect(() => {
    if (!lesson || showCheckpoint) return;

    const currentChunk = lesson.chunks[currentChunkIndex];
    if (!currentChunk) return;

    setRevealedWordCount(0);
    setIsChunkComplete(false);
    setTutorState('talking');

    const words = currentChunk.say.split(/\s+/).filter(Boolean);
    const totalWords = words.length;

    // Speech Synthesis
    if (!isMuted && typeof window !== 'undefined') {
      stopSpeech();

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentChunk.say);
        utterance.rate = 0.95;
        
        utterance.onboundary = (e) => {
          if (e.name === 'word') {
            setRevealedWordCount((prev) => Math.min(prev + 1, totalWords));
          }
        };

        utterance.onend = () => {
          setRevealedWordCount(totalWords);
          setIsChunkComplete(true);
          setTutorState('idle');
        };

        window.speechSynthesis.speak(utterance);
      }
    }

    // Word Timer Fallback Reveal
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    const msPerWord = Math.max(180, Math.floor(4000 / Math.max(totalWords, 1)));

    wordTimerRef.current = setInterval(() => {
      setRevealedWordCount((prev) => {
        if (prev + 1 >= totalWords) {
          if (wordTimerRef.current) clearInterval(wordTimerRef.current);
          setIsChunkComplete(true);
          setTutorState('idle');
          return totalWords;
        }
        return prev + 1;
      });
    }, msPerWord);

    return () => {
      if (wordTimerRef.current) clearInterval(wordTimerRef.current);
      stopSpeech();
    };
  }, [currentChunkIndex, lesson, showCheckpoint, isMuted]);

  // Accumulate notes for board on chunk completion
  useEffect(() => {
    if (isChunkComplete && lesson && lesson.chunks[currentChunkIndex]) {
      const chunkText = lesson.chunks[currentChunkIndex].say;
      setAccumulatedNotes((prev) => {
        if (!prev.includes(chunkText)) {
          return [...prev, chunkText];
        }
        return prev;
      });
    }
  }, [isChunkComplete, currentChunkIndex, lesson]);

  const handleNextChunk = () => {
    if (!lesson) return;
    if (currentChunkIndex + 1 < lesson.chunks.length) {
      setCurrentChunkIndex((prev) => prev + 1);
    } else {
      setShowCheckpoint(true);
      setTutorState('thinking');
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) stopSpeech();

    const current = getStoreData();
    if (current.graphs) {
      current.graphs.forEach((g) => {
        if (g.learnerProfile) {
          g.learnerProfile.voiceMuted = nextMute;
        }
      });
    }
    if (current.learnerProfile) {
      current.learnerProfile.voiceMuted = nextMute;
    }
    saveStoreData(current);
  };

  const handleExit = () => {
    stopSpeech();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xpedition_exit_override', 'true');
    }
    router.push('/home');
  };

  const handleRaiseHandOption = (option: 'say_again' | 'another_example' | 'im_lost') => {
    stopSpeech();
    if (option === 'say_again') {
      setShowRaiseHandNotice('Re-reading current topic...');
      setRevealedWordCount(0);
      setIsChunkComplete(false);
      setTutorState('talking');
    } else if (option === 'another_example') {
      setShowRaiseHandNotice('Alternative Example: Think of this like a factory processing inputs into outputs.');
      setTutorState('talking');
    } else if (option === 'im_lost') {
      setShowRaiseHandNotice('Key takeaway: Focus on the core definition on the right board.');
      setTutorState('thinking');
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitCheckpoint = () => {
    if (selectedOption === null || !lesson || isSubmitted) return;

    const correct = selectedOption === lesson.checkpoint.answerIndex;
    setIsSubmitted(true);
    setIsCorrect(correct);
    setTutorState(correct ? 'happy' : 'thinking');

    const itemHash = computeItemHash(lesson.checkpoint.ask, lesson.checkpoint.options);
    recordAttempt({
      id: `chk_${conceptId}_${Date.now()}`,
      conceptId,
      conceptName,
      isCorrect: correct,
      timestamp: Date.now(),
      chosenIndex: selectedOption,
      chosenText: lesson.checkpoint.options[selectedOption],
      correctIndex: lesson.checkpoint.answerIndex,
      itemHash,
    });
  };

  const handleProceedToQuest = () => {
    stopSpeech();
    router.push(`/quest?concept=${encodeURIComponent(conceptId)}`);
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#0B0E14] text-[#EDEAE0] flex items-center justify-center p-4 font-mono text-sm animate-pulse">
        Preparing lesson for &quot;{conceptName}&quot;...
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="h-[100dvh] w-full bg-[#0B0E14] text-[#EDEAE0] flex items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-[#151921] border border-white/10 rounded-[20px] p-8 space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-wider">
              ROBO CLASSROOM
            </span>
            <h1 className="font-sans font-bold text-xl text-white">{conceptName}</h1>
            <p className="font-sans text-xs text-gray-400 leading-relaxed">
              {conceptSummary || `Core concept in ${storeData?.goalText || 'your active goal'}.`}
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleProceedToQuest}
              className="w-full h-[46px] rounded-[12px] bg-[#2196F3] hover:bg-[#1976D2] text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Practice Questions Now</span>
              <span>→</span>
            </button>
            <button type="button" onClick={handleExit} className="block w-full font-mono text-xs text-gray-400 hover:text-white pt-1 cursor-pointer">
              ✕ Exit to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentChunk = lesson.chunks[currentChunkIndex];
  const words = currentChunk ? currentChunk.say.split(/\s+/).filter(Boolean) : [];
  const revealedText = words.slice(0, revealedWordCount).join(' ');

  return (
    <div className="h-[100dvh] w-full bg-[#0B0E14] text-white select-none relative overflow-hidden flex flex-col justify-between font-sans">
      
      {/* =========================================================================
          1. HEADER BAR (h-12, fixed top)
          Left: ← Back Arrow + LIVE Red Pill Badge
          Center: Robo Class / [conceptName]
          Right: ⋮ Menu
          ========================================================================= */}
      <header className="h-12 px-4 bg-[#0B0E14] border-b border-white/10 flex items-center justify-between relative z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExit}
            className="text-white/80 hover:text-white transition-colors cursor-pointer text-lg"
            aria-label="Back to home"
          >
            ←
          </button>

          {/* LIVE Red Pill Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E53935] text-white font-sans font-bold text-[10px] tracking-wider uppercase shadow">
            <span>LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* Center Title & Concept Name */}
        <div className="text-center truncate max-w-[200px] sm:max-w-[360px]">
          <h1 className="font-sans font-semibold text-xs sm:text-sm text-white leading-none">
            Robo Class
          </h1>
          <span className="font-sans font-medium text-[10px] text-gray-400 block truncate mt-0.5">
            {conceptName}
          </span>
        </div>

        {/* Right Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenuDropdown(!showMenuDropdown)}
            className="text-white/80 hover:text-white p-1 transition-colors cursor-pointer text-lg"
            aria-label="Menu options"
          >
            ⋮
          </button>

          {showMenuDropdown && (
            <div className="absolute right-0 top-9 w-48 bg-[#151921] border border-white/15 rounded-[12px] p-2 shadow-2xl z-40 font-mono text-xs space-y-1 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setShowMenuDropdown(false);
                  handleProceedToQuest();
                }}
                className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-white/10 text-[#2196F3] flex items-center justify-between cursor-pointer font-semibold"
              >
                <span>Skip to Questions</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenuDropdown(false);
                  handleExit();
                }}
                className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-white/10 text-gray-400 cursor-pointer"
              >
                Exit Class
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 flex flex-col justify-between space-y-2">
        
        {/* Notice Banner */}
        {showRaiseHandNotice && (
          <div className="p-2 rounded-[10px] bg-violet-600/20 border border-violet-500/40 text-violet-200 font-sans text-xs flex items-center justify-between animate-fadeIn shrink-0">
            <span>✋ {showRaiseHandNotice}</span>
            <button type="button" onClick={() => setShowRaiseHandNotice(null)} className="text-violet-400 text-xs font-mono cursor-pointer">✕</button>
          </div>
        )}

        {!showCheckpoint ? (
          <div className="flex flex-col space-y-2 flex-1 min-h-0">
            
            {/* =========================================================================
                2. BLACKBOARD PANEL (h-[52vh], relative overflow-hidden)
                - Background: #1A2B24 with /blackboard.jpg texture
                - Speech Bubble: top-left (absolute top-3 left-3, max-w-[45%], max-h-[40%], white bg, dark text)
                - Board Text: right side (absolute top-3 right-3 left-[48%], chalk font Caveat)
                - Robot Image: bottom-left (absolute bottom-0 left-0, h-[45%], object-contain)
                - Wooden Ledge: bottom (h-4 bg-[#8B6340], absolute bottom-0)
                ========================================================================= */}
            <div
              className="relative w-full h-[52vh] border-4 border-[#3D2918] rounded-[18px] shadow-2xl overflow-hidden shrink-0 bg-[#1A2B24]"
              style={{
                backgroundImage: 'url(/blackboard.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Dark overlay for chalk readability */}
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />

              {/* SPEECH BUBBLE (absolute top-3 left-3, max-w-[45%], max-h-[40%] overflow-auto) */}
              <div className="speech-bubble absolute top-3 left-3 z-30 w-[85%] sm:w-[45%] max-w-[280px] max-h-[40%] overflow-y-auto bg-white text-[#1A1A23] p-2.5 rounded-[12px] shadow-xl animate-fadeIn">
                {/* Tail pointing down-left toward robot head */}
                <div
                  className="absolute left-5 -bottom-2 w-0 h-0 border-t-[8px] border-t-white border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent pointer-events-none"
                  aria-hidden="true"
                />

                <div className="space-y-1">
                  <p className="font-sans font-medium text-xs sm:text-sm text-[#1A1A23] leading-snug">
                    {revealedText || <span className="font-mono text-gray-400 animate-pulse">. . .</span>}
                    {!isChunkComplete && revealedText && <span className="inline-block w-1.5 h-3 ml-1 bg-[#2196F3] animate-pulse" />}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono border-t border-gray-100">
                    <span className="text-gray-400">Chunk {currentChunkIndex + 1}/{lesson.chunks.length}</span>
                    {isChunkComplete && (
                      <button
                        type="button"
                        onClick={handleNextChunk}
                        className="ml-auto px-2 py-0.5 rounded bg-[#2196F3] hover:bg-[#1976D2] text-white font-sans font-semibold text-[10px] cursor-pointer"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* BOARD TEXT (absolute top-3 right-3 left-[48%], chalk font Caveat, color #EDEAE0) */}
              <div className="board-text absolute top-3 right-3 left-[48%] bottom-5 overflow-y-auto font-['Caveat','Kalam',cursive] text-[#EDEAE0] text-sm sm:text-base leading-relaxed space-y-2 pr-1 z-10">
                {/* Concept Main Title Underlined */}
                <div className="pb-1 border-b border-[#EDEAE0]/40">
                  <h2 className="text-base sm:text-xl font-semibold text-white tracking-wide">
                    {conceptName}
                  </h2>
                </div>

                {/* Accumulated chunks on board */}
                {accumulatedNotes.length > 0 && (
                  <div className="space-y-1.5">
                    {accumulatedNotes.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-1 text-[#EDEAE0]/85">
                        <span className="text-amber-300 font-mono text-xs mt-0.5 select-none">✎</span>
                        <p className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{pt}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current writing chunk */}
                {revealedText && (
                  <div className="flex items-start gap-1 text-[#EDEAE0] font-semibold animate-fadeIn">
                    <span className="text-cyan-300 font-mono text-xs mt-0.5 select-none animate-pulse">✏</span>
                    <p className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{revealedText}</p>
                  </div>
                )}
              </div>

              {/* WOODEN LEDGE (h-4 bg-[#8B6340], absolute bottom-0) */}
              <div className="chalk-ledge absolute bottom-0 left-0 right-0 h-4 bg-[#8B6340] border-t border-[#5C3A21] flex items-center justify-end px-3 gap-2 z-10">
                <span className="w-4 h-1.5 bg-[#EDEAE0] rounded-sm transform -rotate-6 opacity-90" title="White chalk stub" />
                <span className="w-3.5 h-1.5 bg-[#FDD835] rounded-sm transform rotate-12 opacity-90" title="Yellow chalk stub" />
                <span className="w-5 h-1.5 bg-[#00E5FF] rounded-sm transform -rotate-3 opacity-90" title="Cyan chalk stub" />
              </div>

              {/* ROBOT CHARACTER PNG (absolute bottom-0 left-0, h-[45%], object-contain) */}
              <img
                src={robotImgPath}
                onError={() => {
                  if (robotImgPath === '/robot.png') {
                    setRobotImgPath('/images/robot.png');
                  }
                }}
                alt="XPedition tutor robot"
                className={`robot-image absolute bottom-0 left-0 z-20 h-[45%] object-contain object-bottom state-${tutorState}`}
              />

            </div>

            {/* =========================================================================
                3. TODAY'S TOPICS (~h-[18vh], collapsible card)
                - Real lesson chunks
                - ✓ done, ● current, ○ upcoming
                - Collapsed by default on mobile
                ========================================================================= */}
            <div className="bg-[#151921] border border-white/10 rounded-[14px] p-2.5 space-y-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-white cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span>📋</span>
                  <span>Today&apos;s Topics</span>
                  <span className="text-[10px] text-gray-400">({lesson.chunks.length})</span>
                </div>
                <span className="text-gray-400 text-xs">{isTopicsExpanded ? '▲ Hide' : '▼ Show'}</span>
              </button>

              <div className={`${isTopicsExpanded ? 'block' : 'hidden sm:block'} space-y-1.5 pt-1.5 border-t border-white/10 animate-fadeIn`}>
                {lesson.chunks.map((chk, idx) => {
                  const isDone = idx < currentChunkIndex;
                  const isCurrent = idx === currentChunkIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 py-1 px-2 rounded-[6px] text-xs ${
                        isCurrent
                          ? 'text-[#2196F3] font-bold bg-[#2196F3]/10'
                          : isDone
                            ? 'text-white/80'
                            : 'text-gray-500'
                      }`}
                    >
                      <span className="font-mono text-xs">
                        {isDone ? <span className="text-[#2196F3] font-bold">✓</span> : isCurrent ? <span className="text-[#2196F3] font-bold">●</span> : <span className="text-gray-500">○</span>}
                      </span>
                      <span className="truncate font-sans text-[11px]">
                        Topic {idx + 1}: {chk.say.substring(0, 30)}...
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* =========================================================================
                4. RAISE HAND HELPER (3 Pill Buttons: "Say again", "Another example", "I'm lost")
                Fixed above bottom bar, no chat input
                ========================================================================= */}
            <div className="bg-[#151921] border border-[#2196F3]/30 rounded-[14px] p-2 space-y-1.5 shrink-0">
              <div className="font-mono text-[9px] uppercase text-[#2196F3] font-bold text-center tracking-wider">
                ✋ RAISE HAND FOR HELP
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRaiseHandOption('say_again')}
                  className="h-[36px] px-2 rounded-full bg-[#2196F3]/10 border border-[#2196F3]/40 hover:border-[#2196F3] text-[#2196F3] font-sans font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <span>🔁 Say again</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRaiseHandOption('another_example')}
                  className="h-[36px] px-2 rounded-full bg-[#2196F3]/10 border border-[#2196F3]/40 hover:border-[#2196F3] text-[#2196F3] font-sans font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <span>💡 Another ex.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRaiseHandOption('im_lost')}
                  className="h-[36px] px-2 rounded-full bg-[#2196F3]/10 border border-[#2196F3]/40 hover:border-[#2196F3] text-[#2196F3] font-sans font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <span>😕 I&apos;m lost</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* CHECKPOINT VERIFICATION CARD */
          <div className="bg-[#151921] border border-white/15 rounded-[18px] p-4 sm:p-6 space-y-4 shadow-2xl flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <img
                src={robotImgPath}
                alt="XPedition tutor robot"
                className={`h-14 w-auto object-contain state-${tutorState}`}
              />
              <div>
                <span className="font-mono text-[9px] uppercase text-[#2196F3] font-bold block">
                  CLASSROOM CHECKPOINT VERIFICATION
                </span>
                <h2 className="font-sans font-semibold text-xs sm:text-sm text-white leading-snug">
                  {lesson.checkpoint.ask}
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              {lesson.checkpoint.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isAnswerIdx = idx === lesson.checkpoint.answerIndex;

                let optionStyle = 'bg-[#1C212C] border-white/10 hover:border-[#2196F3] text-white';

                if (isSubmitted) {
                  if (isAnswerIdx) {
                    optionStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold';
                  } else if (isSelected) {
                    optionStyle = 'bg-rose-500/20 border-rose-400 text-rose-300 font-semibold';
                  } else {
                    optionStyle = 'bg-black/30 border-transparent text-gray-500';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-[#2196F3]/20 border-[#2196F3] text-white shadow';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full min-h-[44px] p-3 rounded-[10px] border text-left font-sans text-xs flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-2.5 pr-2">
                      <span className="font-mono text-xs font-bold text-[#2196F3] min-w-[16px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div className="space-y-3 animate-fadeIn">
                <div className={`p-3 rounded-[10px] border ${isCorrect ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-rose-500/20 border-rose-400 text-rose-200'}`}>
                  <span className="font-mono text-xs font-bold block mb-1">
                    {isCorrect ? '✓ Excellent work!' : '✕ Let&apos;s review.'}
                  </span>
                  <p className="font-sans text-xs leading-relaxed">
                    {lesson.checkpoint.why}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {!isCorrect && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCheckpoint(false);
                        setCurrentChunkIndex(0);
                        setSelectedOption(null);
                        setIsSubmitted(false);
                        setIsCorrect(null);
                      }}
                      className="h-[36px] px-3 rounded-[8px] bg-[#1C212C] border border-white/20 text-xs font-sans text-white hover:border-[#2196F3] cursor-pointer"
                    >
                      ← Revisit Lesson
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleProceedToQuest}
                    className="h-[36px] px-4 rounded-[8px] bg-[#2196F3] hover:bg-[#1976D2] text-white font-sans font-semibold text-xs flex items-center gap-1.5 ml-auto shadow cursor-pointer"
                  >
                    <span>Start Quest Questions</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {!isSubmitted && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleSubmitCheckpoint}
                  className={`h-[38px] px-5 rounded-[10px] font-sans font-semibold text-xs transition-all cursor-pointer ${
                    selectedOption !== null
                      ? 'bg-[#2196F3] hover:bg-[#1976D2] text-white font-bold'
                      : 'bg-black/40 text-gray-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  Verify Checkpoint
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* =========================================================================
          5. BOTTOM BAR (h-16, fixed bottom)
          4 Icons: Mute, Camera Off (greyed), Raise Hand, Chat
          ========================================================================= */}
      <footer className="h-16 px-4 bg-[#0B0E14] border-t border-white/10 flex items-center justify-around shrink-0 relative z-30">
        
        {/* Mute */}
        <button
          type="button"
          onClick={handleToggleMute}
          className="flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all ${
            isMuted ? 'bg-[#212631] text-gray-400' : 'bg-[#212631] group-hover:bg-[#2A3140]'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="font-sans text-[10px] text-gray-300 font-medium">
            {isMuted ? 'Muted' : 'Mute'}
          </span>
        </button>

        {/* Camera Off (Greyed out) */}
        <button
          type="button"
          disabled
          className="flex flex-col items-center justify-center gap-0.5 cursor-not-allowed opacity-60"
          title="Camera unavailable"
        >
          <div className="w-9 h-9 rounded-full bg-[#212631] flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="font-sans text-[10px] text-gray-400 font-medium">
            Camera Off
          </span>
        </button>

        {/* Raise Hand */}
        <button
          type="button"
          onClick={() => handleRaiseHandOption('say_again')}
          className="flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-[#212631] group-hover:bg-[#2A3140] flex items-center justify-center text-white transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6V6a1.5 1.5 0 113 0m0 6V4.5a1.5 1.5 0 113 0m0 7.5V7.5a1.5 1.5 0 113 0m0 4v3.5A4.5 4.5 0 0113.5 19.5h-3A4.5 4.5 0 016 15v-3.5" />
            </svg>
          </div>
          <span className="font-sans text-[10px] text-gray-300 font-medium">
            Raise Hand
          </span>
        </button>

        {/* Chat / Notes */}
        <button
          type="button"
          onClick={() => setShowNotesModal(true)}
          className="flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-[#212631] group-hover:bg-[#2A3140] flex items-center justify-center text-white transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-sans text-[10px] text-gray-300 font-medium">
            Chat
          </span>
        </button>

      </footer>

      {/* MINIMAL NOTES MODAL */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-md w-full bg-[#151921] border border-white/20 rounded-[20px] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold text-[#2196F3]">💬 LEARNER CLASSROOM NOTES</span>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="text-white/60 hover:text-white text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <textarea
              value={learnerNotes}
              onChange={(e) => setLearnerNotes(e.target.value)}
              placeholder="Jot down quick thoughts or takeaways from this lesson..."
              className="w-full h-32 bg-[#0B0E14] border border-white/15 rounded-[12px] p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#2196F3] resize-none font-sans"
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="h-[36px] px-5 rounded-[10px] bg-[#2196F3] hover:bg-[#1976D2] text-white font-sans font-semibold text-xs cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
