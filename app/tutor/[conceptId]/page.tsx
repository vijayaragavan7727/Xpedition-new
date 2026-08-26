'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getStoreData, saveStoreData, saveActiveSession, recordAttempt, computeItemHash, UserStoreData } from '@/lib/store';
import { TutorAvatar, TutorState } from '@/components/TutorAvatar';
import { TutorBoard } from '@/components/TutorBoard';

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

  // Lesson State & Telemetry
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [revealedWordCount, setRevealedWordCount] = useState<number>(0);
  const [isChunkComplete, setIsChunkComplete] = useState<boolean>(false);
  const [showCheckpoint, setShowCheckpoint] = useState<boolean>(false);
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false); // DEFAULT ON

  // Checkpoint State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Adaptive Interventions State
  const [hesitationMessage, setHesitationMessage] = useState<string | null>(null);
  const [fastSkipCount, setFastSkipCount] = useState<number>(0);
  const [showSkipToQuestionsOffer, setShowSkipToQuestionsOffer] = useState<boolean>(false);
  const [tabSwitchNotice, setTabSwitchNotice] = useState<string | null>(null);
  const [accumulatedNotes, setAccumulatedNotes] = useState<string[]>([]);
  
  // Classroom Raise Hand & Topics State
  const [showRaiseHandModal, setShowRaiseHandModal] = useState<boolean>(false);
  const [raiseHandNotice, setRaiseHandNotice] = useState<string | null>(null);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState<boolean>(false);

  // Timers & Speech Refs
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hesitationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkStartTimeRef = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop speech synthesis & HTML audio element on cleanup
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

  const handleRaiseHandOpen = () => {
    stopSpeech();
    setShowRaiseHandModal(true);
  };

  const handleRaiseHandOption = (option: 'say_again' | 'another_example' | 'im_lost') => {
    console.log('[RaiseHand Telemetry]', { chunkIndex: currentChunkIndex, option });
    setShowRaiseHandModal(false);

    if (option === 'say_again') {
      setRaiseHandNotice('Re-reading current chunk at 0.8x pace...');
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setRevealedWordCount(0);
      setIsChunkComplete(false);
      setTutorState('talking');
    } else if (option === 'another_example') {
      setRaiseHandNotice('Alternative Example: Think of this like a factory line where inputs are transformed into outputs step-by-step.');
      setTutorState('talking');
    } else if (option === 'im_lost') {
      setRaiseHandNotice('Simplified Concept: Core takeaway is just remembering the primary input and output of this reaction.');
      setTutorState('talking');
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

    const cName = queryParam || concept?.name || store.goalText || 'Quick Concept';
    const cSummary = (concept as any)?.summary || 'Quick single-question answer';
    const lang = activeGraph?.learnerProfile?.language || store.learnerProfile?.language || 'english';
    const level = activeGraph?.learnerProfile?.startingLevel || store.learnerProfile?.startingLevel || 'Complete beginner';
    const mastery = concept?.masteryPercentage || 0;

    setConceptName(cName);
    setConceptSummary(cSummary);

    console.log('[Language Diagnostic 1] Profile Stored Language:', lang);
    console.log('[Language Diagnostic 2] Sent to /api/lesson:', { conceptName: cName, language: lang, startingLevel: level });

    // Fetch interactive lesson content from API
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
            // Apply Personalized Greeting to Chunk 1 if valid learner name is present
            const rawName = activeGraph?.learnerProfile?.name || store.learnerProfile?.name || store.handle || '';
            const cleanName = rawName.trim();
            const isGeneric = !cleanName || ['learner', 'null', 'undefined'].includes(cleanName.toLowerCase());

            if (!isGeneric && data.chunks[0]?.say) {
              const currentChunk1 = data.chunks[0].say;
              let greeting = '';
              if (lang === 'tamil') {
                greeting = `ஹே ${cleanName}, இன்னைக்கி ${cName} பத்தி பேசலாம். `;
              } else if (lang === 'tanglish') {
                greeting = `Hey ${cleanName}, indha concept ${cName} romba interesting-a irukkum. `;
              } else {
                greeting = `Hey ${cleanName}, let's dig into ${cName} today. `;
              }

              if (!currentChunk1.startsWith('Hey ') && !currentChunk1.startsWith('ஹே ')) {
                data.chunks[0].say = `${greeting}${currentChunk1}`;
              }
            }

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

  // Tab switch detection (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSpeech();
      } else {
        setTabSwitchNotice(`Welcome back! We were on chunk ${currentChunkIndex + 1}.`);
        setTimeout(() => setTabSwitchNotice(null), 4000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentChunkIndex]);

  // Speech Synthesis Voice Resolution & Diagnostic State
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [missingTamilVoiceNotice, setMissingTamilVoiceNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const vList = window.speechSynthesis.getVoices();
      setAvailableVoices(vList);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const resolveTutorVoice = (langSetting: string) => {
    const normLang = String(langSetting).toLowerCase().trim();

    if (normLang === 'tamil') {
      const taVoice = availableVoices.find((v) => v.lang.toLowerCase().startsWith('ta'));
      if (!taVoice) {
        return { voice: null, lang: 'ta-IN', rate: 0.95, missingTamilVoice: true };
      }
      return { voice: taVoice, lang: 'ta-IN', rate: 0.95, missingTamilVoice: false };
    }

    if (normLang === 'tanglish') {
      const enInVoice = availableVoices.find(
        (v) => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india')
      );
      const enVoice = enInVoice || availableVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
      return { voice: enVoice || null, lang: 'en-IN', rate: 1.0, missingTamilVoice: false };
    }

    const enInVoice = availableVoices.find(
      (v) => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india')
    );
    const enVoice = enInVoice || availableVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
    return { voice: enVoice || null, lang: 'en-US', rate: 1.0, missingTamilVoice: false };
  };

  // 4-LEVEL FALLBACK AUDIO ENGINE WITH TIMEUPDATE WORD SYNC & NEXT CHUNK PRE-FETCHING
  useEffect(() => {
    if (!lesson || showCheckpoint) return;

    stopSpeech();
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);

    const chunk = lesson.chunks[currentChunkIndex];
    if (!chunk) return;

    chunkStartTimeRef.current = Date.now();
    const words = chunk.say.split(' ');
    const langSetting = storeData?.learnerProfile?.language || 'english';

    // Reduced Motion Check
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setRevealedWordCount(words.length);
      setIsChunkComplete(true);
      setTutorState('idle');
      return;
    }

    setRevealedWordCount(1);
    setIsChunkComplete(false);
    setTutorState('talking');

    let isAudioPlaying = false;

    async function initializeAudio() {
      if (isMuted) {
        // Muted fallback timer pacing
        const msPerWord = langSetting === 'tamil' ? 428 : 333;
        let wordIdx = 1;
        wordTimerRef.current = setInterval(() => {
          wordIdx++;
          setRevealedWordCount(wordIdx);
          if (wordIdx >= words.length) {
            if (wordTimerRef.current) clearInterval(wordTimerRef.current);
            setIsChunkComplete(true);
            setTutorState('idle');
          }
        }, msPerWord);
        return;
      }

      // LEVEL 1 & 2: Sarvam AI Audio (Cached or Fresh API)
      try {
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunk.say, language: langSetting, speaker: 'ratan' }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.audioBase64) {
            setMissingTamilVoiceNotice(null);
            const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
            audioRef.current = audio;
            isAudioPlaying = true;

            audio.ontimeupdate = () => {
              if (audio.duration && !isNaN(audio.duration)) {
                const progress = audio.currentTime / audio.duration;
                const count = Math.floor(progress * words.length);
                setRevealedWordCount(Math.max(1, Math.min(count + 1, words.length)));
              }
            };

            audio.onended = () => {
              setRevealedWordCount(words.length);
              setIsChunkComplete(true);
              setTutorState('idle');

              hesitationTimerRef.current = setTimeout(() => {
                setHesitationMessage('Want me to go over that again slower?');
              }, 15000);
            };

            audio.play().catch(() => {
              console.warn('[Audio Engine] Autoplay blocked by browser. Reading along mode enabled.');
            });

            // PRE-FETCH NEXT CHUNK'S AUDIO IN BACKGROUND
            if (lesson && currentChunkIndex + 1 < lesson.chunks.length) {
              const nextChunk = lesson.chunks[currentChunkIndex + 1];
              fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: nextChunk.say, language: langSetting, speaker: 'ratan' }),
              }).catch(() => {});
            }

            return;
          }
        }
      } catch (err) {
        console.warn('[Audio Engine] Sarvam AI endpoint unavailable, trying browser fallback...');
      }

      // LEVEL 3: Browser SpeechSynthesis (ONLY if matching voice exists on device)
      const voiceInfo = resolveTutorVoice(langSetting);
      if (!voiceInfo.missingTamilVoice && typeof window !== 'undefined' && window.speechSynthesis) {
        setMissingTamilVoiceNotice(null);
        const utterance = new SpeechSynthesisUtterance(chunk.say);
        utterance.lang = voiceInfo.lang;
        if (voiceInfo.voice) utterance.voice = voiceInfo.voice;
        utterance.rate = voiceInfo.rate;

        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            const spokenText = chunk.say.substring(0, event.charIndex + event.charLength);
            const count = spokenText.trim().split(/\s+/).length;
            setRevealedWordCount(Math.min(count, words.length));
          }
        };

        utterance.onend = () => {
          setRevealedWordCount(words.length);
          setIsChunkComplete(true);
          setTutorState('idle');
        };

        window.speechSynthesis.speak(utterance);
        return;
      }

      // LEVEL 4: Honest Reading-along mode
      setMissingTamilVoiceNotice('No audio voice available on this device — reading along instead.');
      const msPerWord = langSetting === 'tamil' ? 428 : 333;
      let wordIdx = 1;
      wordTimerRef.current = setInterval(() => {
        wordIdx++;
        setRevealedWordCount(wordIdx);
        if (wordIdx >= words.length) {
          if (wordTimerRef.current) clearInterval(wordTimerRef.current);
          setIsChunkComplete(true);
          setTutorState('idle');
        }
      }, msPerWord);
    }

    initializeAudio();

    // Accumulate key points for the whiteboard
    if (!chunk.code) {
      setAccumulatedNotes((prev) => {
        if (!prev.includes(chunk.say)) {
          return [...prev, chunk.say];
        }
        return prev;
      });
    }

    // Save persistent resume state
    saveActiveSession({
      conceptId,
      conceptName,
      currentIndex: currentChunkIndex,
      totalLength: lesson.chunks.length,
      completedItemIds: [],
      updatedAt: Date.now(),
    });

    return () => {
      stopSpeech();
      if (wordTimerRef.current) clearInterval(wordTimerRef.current);
      if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
    };
  }, [currentChunkIndex, lesson, showCheckpoint, isMuted]);

  const handleSkipChunkText = () => {
    stopSpeech();
    if (!lesson) return;
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);

    const chunk = lesson.chunks[currentChunkIndex];
    if (chunk) {
      setRevealedWordCount(chunk.say.split(' ').length);
      setIsChunkComplete(true);
      setTutorState('idle');
    }

    // Detect fast skipping (<2s time on chunk)
    const elapsed = Date.now() - chunkStartTimeRef.current;
    if (elapsed < 2000) {
      const nextFast = fastSkipCount + 1;
      setFastSkipCount(nextFast);
      if (nextFast >= 2) {
        setShowSkipToQuestionsOffer(true);
      }
    }
  };

  const handleNextChunk = () => {
    stopSpeech();
    setHesitationMessage(null);
    if (!lesson) return;

    if (currentChunkIndex + 1 < lesson.chunks.length) {
      setCurrentChunkIndex((prev) => prev + 1);
    } else {
      setShowCheckpoint(true);
      setTutorState('thinking');
    }
  };

  const handleReRevealChunk = () => {
    stopSpeech();
    setHesitationMessage(null);
    setRevealedWordCount(1);
    setIsChunkComplete(false);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) stopSpeech();

    const current = getStoreData();
    const activeGraph = current.graphs?.find((g) => g.id === current.activeGraphId) || current.graphs?.[0];
    if (activeGraph) {
      if (!activeGraph.learnerProfile) {
        activeGraph.learnerProfile = {
          pathType: 'goal',
          topic: activeGraph.goalText || 'General',
          language: 'english',
          dailyMinutes: 30,
          startingLevel: 'Complete beginner',
        };
      }
      activeGraph.learnerProfile.voiceMuted = nextMute;
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
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 font-mono text-sm text-muted animate-pulse">
        Tutor preparing lesson for &quot;{conceptName}&quot;...
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-[#120E22] border border-line rounded-[20px] p-8 space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              TUTOR SUMMARY
            </span>
            <h1 className="font-sans font-bold text-xl text-text">{conceptName}</h1>
            <p className="font-sans text-xs text-muted leading-relaxed">
              {conceptSummary || `Core concept in ${storeData?.goalText || 'your active goal'}.`}
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleProceedToQuest}
              className="w-full h-[46px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-2"
            >
              <span>Practice Questions Now</span>
              <span>→</span>
            </button>
            <button type="button" onClick={handleExit} className="block w-full font-mono text-xs text-muted hover:text-text pt-1">
              ✕ Exit to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentChunk = lesson.chunks[currentChunkIndex];
  const words = currentChunk ? currentChunk.say.split(' ') : [];
  const revealedText = words.slice(0, revealedWordCount).join(' ');

  return (
    <div className="min-h-[100dvh] bg-[#0E1512] text-text select-none relative overflow-x-hidden flex flex-col justify-between p-3 sm:p-6">
      {/* Background Classroom Atmosphere Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-emerald-950/20 rounded-full blur-[150px] pointer-events-none" />

      {/* SLIM CLASSROOM HEADER BAR */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleExit} className="font-mono text-xs text-[#EDEAE0]/70 hover:text-white transition-colors cursor-pointer">
            ✕ Exit
          </button>
          <span className="h-3 w-[1px] bg-white/20" />
          <span className="font-mono text-xs text-amber-200 font-semibold truncate max-w-[150px] sm:max-w-[280px]">
            {conceptName}
          </span>
        </div>

        {/* PROGRESS BAR & CONTROLS */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#EDEAE0]/60 uppercase hidden sm:inline">
              Chunk {currentChunkIndex + 1}/{lesson.chunks.length}
            </span>
            <div className="w-24 sm:w-36 h-2 rounded-full bg-[#1A2B24] border border-white/15 overflow-hidden p-0.5">
              <div
                className="h-full bg-amber-300 rounded-full transition-all duration-300"
                style={{ width: `${((currentChunkIndex + 1) / lesson.chunks.length) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={Boolean(missingTamilVoiceNotice)}
            onClick={handleToggleMute}
            className={`px-3 py-1.5 rounded-[8px] border font-mono text-xs flex items-center gap-1.5 transition-all ${
              missingTamilVoiceNotice
                ? 'bg-raised/40 border-line/40 text-muted/50 cursor-not-allowed'
                : isMuted
                  ? 'bg-[#1A2B24] border-white/20 text-[#EDEAE0]/70 hover:text-white cursor-pointer'
                  : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 cursor-pointer shadow-[0_0_10px_rgba(52,211,153,0.3)]'
            }`}
          >
            <span>{missingTamilVoiceNotice ? '🔇 Voice Unavailable' : isMuted ? '🔇 Sound Off' : '🔊 Sound On'}</span>
          </button>

          <button
            type="button"
            onClick={handleProceedToQuest}
            className="font-mono text-xs text-[#EDEAE0]/60 hover:text-amber-200 transition-colors cursor-pointer hidden sm:block"
          >
            Skip to questions →
          </button>
        </div>
      </header>

      {/* MAIN CLASSROOM WORKSPACE */}
      <main className="w-full max-w-5xl mx-auto my-auto relative z-10 py-4 space-y-5">
        
        {/* Notices */}
        {missingTamilVoiceNotice && (
          <div className="p-3 rounded-[12px] bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <span>⚠️ {missingTamilVoiceNotice}</span>
            <span className="text-[10px] opacity-75">Reading along mode</span>
          </div>
        )}

        {raiseHandNotice && (
          <div className="p-3.5 rounded-[12px] bg-violet-600/20 border border-violet-500/40 text-violet-200 font-sans text-xs flex items-center justify-between animate-fadeIn">
            <span>✋ {raiseHandNotice}</span>
            <button type="button" onClick={() => setRaiseHandNotice(null)} className="text-violet-400 text-xs font-mono">✕ Dismiss</button>
          </div>
        )}

        {!showCheckpoint ? (
          <div className="space-y-4">
            
            {/* 1. BLACKBOARD BOARD COMPONENT (TOP / MAIN SURFACE) */}
            <TutorBoard
              code={currentChunk?.code}
              accumulatedPoints={accumulatedNotes}
              currentChunkText={currentChunk?.say}
              revealedWordCount={revealedWordCount}
            />

            {/* 2. CLASSROOM FLOOR AREA: ROBOT TEACHER WITH POINTER + SPEECH BUBBLE */}
            <div className="relative pt-2 flex items-end gap-3 sm:gap-6 flex-wrap sm:flex-nowrap">
              
              {/* ROBOT TUTOR STANDING ON FLOOR (BOTTOM-LEFT OF BOARD) */}
              <div className="shrink-0">
                <TutorAvatar
                  state={tutorState}
                  pointerAngle={-20 - ((revealedWordCount % 4) * 12)}
                />
              </div>

              {/* HIGH-CONTRAST CLASSROOM SPEECH BUBBLE (BESIDE ROBOT HEAD) */}
              <div className="relative flex-1 min-w-[280px] bg-[#F4F1EA] text-[#1A1A23] border-2 border-[#D8D3C5] p-4 sm:p-5 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-fadeIn">
                {/* Speech Bubble Tail pointing left at Robot */}
                <div
                  className="absolute left-[-12px] bottom-6 w-0 h-0 border-t-[10px] border-t-transparent border-r-[14px] border-r-[#F4F1EA] border-b-[10px] border-b-transparent"
                  aria-hidden="true"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-black/10 pb-1.5 font-mono text-[10px] text-black/60 uppercase">
                    <span className="font-bold text-violet-800">TEACHER SPEECH BUBBLE</span>
                    <span>Chunk {currentChunkIndex + 1} of {lesson.chunks.length}</span>
                  </div>

                  {/* Word-by-Word Revealed Speech Text */}
                  <p className="font-sans font-medium text-base sm:text-lg text-[#1A1A23] leading-relaxed">
                    {revealedText}
                    {!isChunkComplete && <span className="inline-block w-2 h-4 ml-1 bg-violet-600 animate-pulse" />}
                  </p>

                  {/* ACTION CONTROLS ON SPEECH BUBBLE */}
                  <div className="pt-3 border-t border-black/10 flex items-center justify-between flex-wrap gap-2">
                    {/* RAISED HAND BUTTON */}
                    <button
                      type="button"
                      onClick={handleRaiseHandOpen}
                      className="h-[36px] px-3.5 rounded-[10px] bg-violet-600 hover:bg-violet-700 text-white font-sans font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-98"
                    >
                      <span className="text-sm">✋</span>
                      <span>Raise Hand</span>
                    </button>

                    <div className="flex items-center gap-2 ml-auto">
                      {!isChunkComplete ? (
                        <button
                          type="button"
                          onClick={handleSkipChunkText}
                          className="font-mono text-xs text-black/60 hover:text-black transition-colors cursor-pointer"
                        >
                          ⚡ Skip reveal
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleNextChunk}
                          className="h-[36px] px-5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <span>{currentChunkIndex + 1 === lesson.chunks.length ? 'Go to Checkpoint' : 'Next'}</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. TODAY'S TOPICS (COLLAPSIBLE LESSON SYLLABUS LIST BELOW BOARD) */}
            <div className="bg-[#121B17] border border-white/15 rounded-[14px] p-3.5 space-y-3">
              <button
                type="button"
                onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
                className="w-full flex items-center justify-between font-mono text-xs text-[#EDEAE0] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-bold">📋 TODAY&apos;S TOPICS</span>
                  <span className="text-[10px] text-white/50">({lesson.chunks.length} Chunks + Checkpoint)</span>
                </div>
                <span className="text-amber-300 font-bold">{isTopicsExpanded ? '▲ Hide' : '▼ Show Topics'}</span>
              </button>

              {/* Topics Grid (Expanded or Desktop default) */}
              <div className={`${isTopicsExpanded ? 'block' : 'hidden sm:block'} space-y-2 pt-1 border-t border-white/10`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs">
                  {lesson.chunks.map((chk, idx) => {
                    const isDone = idx < currentChunkIndex;
                    const isCurrent = idx === currentChunkIndex;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-[8px] border flex items-center gap-2 ${
                          isCurrent
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold'
                            : isDone
                              ? 'bg-white/5 border-white/10 text-white/60'
                              : 'bg-transparent border-white/5 text-white/30'
                        }`}
                      >
                        <span className="text-sm">
                          {isDone ? '✓' : isCurrent ? '●' : '○'}
                        </span>
                        <span className="truncate">Chunk {idx + 1}: {chk.say.substring(0, 22)}...</span>
                      </div>
                    );
                  })}

                  {/* Checkpoint Topic Tile */}
                  <div
                    className={`p-2.5 rounded-[8px] border flex items-center gap-2 ${
                      showCheckpoint
                        ? 'bg-violet-600/30 border-violet-400 text-violet-200 font-bold'
                        : 'bg-transparent border-white/5 text-white/30'
                    }`}
                  >
                    <span className="text-sm">{showCheckpoint ? '●' : '○'}</span>
                    <span className="truncate">Checkpoint Verification</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* CHECKPOINT CLASSROOM CARD */
          <div className="bg-[#1A2B24] border-2 border-amber-500/40 rounded-[20px] p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-4 border-b border-white/15 pb-4">
              <TutorAvatar state={tutorState} />
              <div>
                <span className="font-mono text-[10px] uppercase text-amber-300 font-bold tracking-eyebrow block">
                  CLASSROOM CHECKPOINT VERIFICATION
                </span>
                <h2 className="font-sans font-bold text-base sm:text-lg text-text leading-snug">
                  {lesson.checkpoint.ask}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {lesson.checkpoint.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isAnswerIdx = idx === lesson.checkpoint.answerIndex;

                let optionStyle = 'bg-[#0F1C17] border-white/15 hover:border-amber-300 text-[#EDEAE0]';

                if (isSubmitted) {
                  if (isAnswerIdx) {
                    optionStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold';
                  } else if (isSelected) {
                    optionStyle = 'bg-rose-500/20 border-rose-400 text-rose-300 font-semibold';
                  } else {
                    optionStyle = 'bg-black/30 border-transparent text-white/40';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-[#284137] border-amber-300 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full min-h-[48px] p-4 rounded-[12px] border text-left font-sans text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="font-mono text-xs font-bold text-amber-300 min-w-[20px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div className="space-y-4 animate-fadeIn">
                <div className={`p-4 rounded-[12px] border ${isCorrect ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-rose-500/20 border-rose-400 text-rose-200'}`}>
                  <span className="font-mono text-xs font-bold block mb-1">
                    {isCorrect ? '✓ Excellent work!' : '✕ Let&apos;s review.'}
                  </span>
                  <p className="font-sans text-xs leading-relaxed">
                    {lesson.checkpoint.why}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
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
                      className="h-[40px] px-4 rounded-[10px] bg-[#0F1C17] border border-white/20 text-xs font-sans text-[#EDEAE0] hover:border-amber-300"
                    >
                      ← Revisit Lesson
                    </button>
                  )}

                  {isQuickLearnMode ? (
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          stopSpeech();
                          router.push('/home');
                        }}
                        className="h-[40px] px-4 rounded-[10px] bg-[#0F1C17] border border-white/20 font-sans font-semibold text-xs text-[#EDEAE0]"
                      >
                        Done & Back to Home
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProceedToQuest}
                      className="h-[40px] px-6 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold text-xs flex items-center gap-2 ml-auto shadow-md"
                    >
                      <span>Start Quest Questions</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isSubmitted && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleSubmitCheckpoint}
                  className={`h-[44px] px-6 rounded-[12px] font-sans font-semibold text-xs transition-all cursor-pointer ${
                    selectedOption !== null
                      ? 'bg-amber-500 hover:bg-amber-400 text-black font-bold'
                      : 'bg-black/40 text-white/30 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  Verify Checkpoint
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* RAISE HAND MODAL (3 FIXED OPTIONS) */}
      {showRaiseHandModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-sm w-full bg-[#121B17] border-2 border-violet-500/50 rounded-[20px] p-6 space-y-5 text-center shadow-[0_0_40px_rgba(147,51,234,0.3)]">
            <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-2xl flex items-center justify-center mx-auto">
              ✋
            </div>

            <div className="space-y-1">
              <h2 className="font-sans font-bold text-lg text-white">Need help on this chunk?</h2>
              <p className="font-sans text-xs text-muted">Select one fixed option below:</p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleRaiseHandOption('say_again')}
                className="w-full h-[46px] px-4 rounded-[12px] bg-[#1A2B24] border border-white/20 hover:border-amber-300 text-amber-200 font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>🔄 Say that again (slower)</span>
              </button>

              <button
                type="button"
                onClick={() => handleRaiseHandOption('another_example')}
                className="w-full h-[46px] px-4 rounded-[12px] bg-[#1A2B24] border border-white/20 hover:border-cyan-300 text-cyan-200 font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>💡 Give me another example</span>
              </button>

              <button
                type="button"
                onClick={() => handleRaiseHandOption('im_lost')}
                className="w-full h-[46px] px-4 rounded-[12px] bg-violet-600/30 border border-violet-400 text-violet-200 font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>🆘 I&apos;m lost (simpler version)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRaiseHandModal(false)}
              className="font-mono text-xs text-muted hover:text-white pt-2 block mx-auto cursor-pointer"
            >
              Resume Lesson
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-5xl mx-auto text-center relative z-10 pt-2">
        <span className="font-mono text-[10px] text-[#EDEAE0]/40 uppercase">
          CLASSROOM AI TUTOR MODE • BLACKBOARD & SPEECH SYNCHRONIZATION
        </span>
      </footer>
    </div>
  );
}
