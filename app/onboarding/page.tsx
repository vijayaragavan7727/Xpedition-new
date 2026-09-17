'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getStoreData,
  saveLearnerProfile,
  LearnerProfileData,
  applySeededCourse,
  createNewSkillGraph,
  setGraphContent,
} from '@/lib/store';
import { SEEDED_PYTHON_COURSE } from '@/lib/seed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  Target,
  BookOpen,
  Wrench,
  Briefcase,
  Sparkles,
  Cpu,
  Brain,
  Code2,
  Atom,
  Palette,
  BarChart3,
  Calculator,
  Database,
  Zap,
  FlaskConical,
  Dna,
  BookA,
  Landmark,
  Clock,
  Gauge,
} from 'lucide-react';

// =============================================================================
// STEP 1: GOALS DATA
// =============================================================================
interface GoalOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'fundamentals',
    title: 'Build strong fundamentals',
    description: 'Master core concepts deeply from first principles.',
    icon: Compass,
  },
  {
    id: 'exam',
    title: 'Prepare for an exam',
    description: 'Target high-yield topics with structured practice and checkpoints.',
    icon: Target,
  },
  {
    id: 'practical',
    title: 'Learn practical skills',
    description: 'Focus on hands-on application and building real-world projects.',
    icon: Wrench,
  },
  {
    id: 'career',
    title: 'Become job-ready',
    description: 'Acquire high-demand capabilities verified through practice.',
    icon: Briefcase,
  },
  {
    id: 'explore',
    title: 'Explore something new',
    description: 'Follow your curiosity with open-ended guided discovery.',
    icon: Sparkles,
  },
];

// =============================================================================
// STEP 2: INTERESTS DATA
// =============================================================================
interface InterestOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const INTEREST_OPTIONS: InterestOption[] = [
  {
    id: 'ai_tech',
    title: 'AI & Modern Tech',
    description: 'Machine learning, neural models, intelligent tools',
    icon: Cpu,
  },
  {
    id: 'problem_solving',
    title: 'Problem Solving & Logic',
    description: 'Algorithmic thinking, puzzles, deductive reasoning',
    icon: Brain,
  },
  {
    id: 'software',
    title: 'Building Real Software',
    description: 'Full-stack applications, APIs, systems engineering',
    icon: Code2,
  },
  {
    id: 'science',
    title: 'Science & Natural World',
    description: 'Physical laws, biological systems, cosmos',
    icon: Atom,
  },
  {
    id: 'creative',
    title: 'Creative Modeling & Design',
    description: 'Interactive worlds, 3D graphics, user experience',
    icon: Palette,
  },
  {
    id: 'data_patterns',
    title: 'Data & Patterns',
    description: 'Analytics, statistical inferences, data pipelines',
    icon: BarChart3,
  },
];

// =============================================================================
// STEP 3: SUBJECT WORLDS DATA
// =============================================================================
interface SubjectOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const SUBJECT_OPTIONS: SubjectOption[] = [
  {
    id: 'programming',
    title: 'Programming',
    description: 'Python, algorithmic structures, logic',
    icon: Code2,
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    description: 'Calculus, algebra, discrete mathematics',
    icon: Calculator,
  },
  {
    id: 'data_science',
    title: 'Data Science',
    description: 'Data analysis, statistics, modeling',
    icon: Database,
  },
  {
    id: 'physics',
    title: 'Physics',
    description: 'Mechanics, electromagnetism, modern physics',
    icon: Zap,
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    description: 'Atomic structure, reactions, organic chemistry',
    icon: FlaskConical,
  },
  {
    id: 'biology',
    title: 'Biology',
    description: 'Cell biology, genetics, ecosystems',
    icon: Dna,
  },
  {
    id: 'english',
    title: 'English',
    description: 'Technical writing, comprehension, vocabulary',
    icon: BookA,
  },
  {
    id: 'history_gk',
    title: 'History / GK',
    description: 'World history, civilizations, global knowledge',
    icon: Landmark,
  },
];

// =============================================================================
// STEP 4: LEARNING TIME DATA
// =============================================================================
interface TimeOption {
  minutes: number;
  label: string;
  tier: string;
  description: string;
}

const TIME_OPTIONS: TimeOption[] = [
  {
    minutes: 15,
    label: '15 min / day',
    tier: 'Micro-Focus',
    description: 'Quick daily quests to build unstoppable consistency.',
  },
  {
    minutes: 30,
    label: '30 min / day',
    tier: 'Steady Pace',
    description: 'Balanced daily rhythm with strong retention.',
  },
  {
    minutes: 45,
    label: '45 min / day',
    tier: 'Dedicated',
    description: 'Deeper practice sessions for accelerated mastery.',
  },
  {
    minutes: 60,
    label: '60+ min / day',
    tier: 'Deep Expedition',
    description: 'Rapid immersion for intensive goals and exams.',
  },
];

// =============================================================================
// STEP 5: STARTING LEVEL DATA
// =============================================================================
interface LevelOption {
  id: string;
  title: string;
  description: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    id: 'Complete beginner',
    title: 'Just getting started',
    description: 'Starting from scratch. Build foundations from ground zero.',
  },
  {
    id: 'Some familiarity',
    title: 'I know the basics',
    description: 'Familiar with core concepts, ready for guided challenges.',
  },
  {
    id: 'Working knowledge',
    title: 'Comfortable',
    description: 'Solid working knowledge. Looking to sharpen real problem-solving.',
  },
  {
    id: 'Advanced',
    title: 'Advanced',
    description: 'Strong foundation. Ready for edge cases and deep mastery.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  // Guided Journey State (0 to 5)
  // 0: Goal, 1: Interests, 2: Subjects, 3: Time, 4: Level, 5: Confirmation
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Selections
  const [selectedGoal, setSelectedGoal] = useState<string>('fundamentals');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['problem_solving', 'software']);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['programming']);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [selectedLevel, setSelectedLevel] = useState<string>('Complete beginner');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Resume step and selections from store on mount
  useEffect(() => {
    const store = getStoreData();
    if (store.learnerProfile) {
      const p = store.learnerProfile;
      if (p.whyGoal) {
        const matchingGoal = GOAL_OPTIONS.find((g) => g.title === p.whyGoal || g.id === p.whyGoal);
        if (matchingGoal) setSelectedGoal(matchingGoal.id);
      }
      if (p.dailyMinutes) setSelectedMinutes(p.dailyMinutes);
      if (p.startingLevel) setSelectedLevel(p.startingLevel);
      if (typeof p.currentStep === 'number' && p.currentStep >= 0 && p.currentStep <= 5) {
        setCurrentStep(p.currentStep);
      }
    }
  }, []);

  // Save progress step locally and to Supabase
  const persistStep = (stepNumber: number, extraData?: Partial<LearnerProfileData>) => {
    setCurrentStep(stepNumber);

    const activeGoalObj = GOAL_OPTIONS.find((g) => g.id === selectedGoal);
    const primarySubject = selectedSubjects[0]
      ? SUBJECT_OPTIONS.find((s) => s.id === selectedSubjects[0])?.title || 'Programming'
      : 'Programming';

    const updated = saveLearnerProfile({
      pathType: 'goal',
      topic: primarySubject,
      whyGoal: activeGoalObj?.title || 'Build strong fundamentals',
      dailyMinutes: selectedMinutes,
      startingLevel: selectedLevel,
      currentStep: stepNumber,
      language: 'english',
      ...extraData,
    });

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.auth.getUser().then(({ data }) => {
        if (data?.user) {
          client
            .from('learner_profile')
            .upsert({
              user_id: data.user.id,
              path_type: 'goal',
              topic: primarySubject,
              daily_minutes: selectedMinutes,
              starting_level: selectedLevel,
              why_goal: activeGoalObj?.title,
              current_step: stepNumber,
              updated_at: new Date().toISOString(),
            })
            .then(() => {});
        }
      });
    }

    return updated;
  };

  // Toggle multi-select items
  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev) : [...prev, id]
    );
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev) : [...prev, id]
    );
  };

  // Next & Back
  const handleNext = () => {
    if (currentStep < 5) {
      persistStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      persistStep(currentStep - 1);
    } else {
      router.push('/');
    }
  };

  // Final Action: Begin Expedition and route to Calibration
  const handleBeginExpedition = async () => {
    setIsSubmitting(true);
    setStatusMessage('Configuring your skill graph with Xira...');

    const activeGoalObj = GOAL_OPTIONS.find((g) => g.id === selectedGoal);
    const primarySubject = selectedSubjects[0]
      ? SUBJECT_OPTIONS.find((s) => s.id === selectedSubjects[0])?.title || 'Programming'
      : 'Programming';

    const goalTopicName = `${primarySubject} — ${activeGoalObj?.title || 'Foundations'}`;

    // 1. Initialize skill graph
    createNewSkillGraph(goalTopicName);

    // 2. Persist learner profile
    saveLearnerProfile({
      pathType: 'goal',
      topic: goalTopicName,
      whyGoal: activeGoalObj?.title,
      dailyMinutes: selectedMinutes,
      startingLevel: selectedLevel,
      currentStep: 5,
      learningMode: 'quest',
    });

    // 3. Populate graph content via /api/goal with fallback to SEEDED_PYTHON_COURSE
    try {
      const res = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalTopicName }),
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
          setGraphContent(goalTopicName, formattedConcepts, data.quests, false);
        } else {
          applySeededCourse(goalTopicName, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
        }
      } else {
        applySeededCourse(goalTopicName, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
      }
    } catch {
      applySeededCourse(goalTopicName, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
    } finally {
      setStatusMessage('Expedition ready. Entering calibration...');
      setTimeout(() => {
        setIsSubmitting(false);
        // Direct route to Calibration as instructed
        router.push('/calibrate');
      }, 500);
    }
  };

  const activeGoal = GOAL_OPTIONS.find((g) => g.id === selectedGoal);
  const activeSubjectNames = selectedSubjects
    .map((sId) => SUBJECT_OPTIONS.find((s) => s.id === sId)?.title)
    .filter(Boolean)
    .join(', ');
  const activeTime = TIME_OPTIONS.find((t) => t.minutes === selectedMinutes);
  const activeLevel = LEVEL_OPTIONS.find((l) => l.id === selectedLevel);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0B0D14] text-[#F8FAFC] flex flex-col justify-between overflow-x-hidden selection:bg-indigo-600 selection:text-white font-sans">
      {/* =========================================================================
          ATMOSPHERIC AMBIENT BACKDROP (Nocturne Scholar)
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[540px] h-[340px] rounded-full blur-[130px]"
          style={{
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, rgba(245, 158, 11, 0.03) 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* =========================================================================
          TOP NAVIGATION BAR: BACK + SUBTLE PROGRESS + EXIT
          ========================================================================= */}
      <header className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{currentStep === 0 ? 'Home' : 'Back'}</span>
        </button>

        {/* Subtle Step Indicator */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            {currentStep < 5 ? `Step ${currentStep + 1} of 5` : 'Expedition Launch'}
          </span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === currentStep
                    ? 'w-5 bg-indigo-500'
                    : step < currentStep
                    ? 'w-2 bg-indigo-400/50'
                    : 'w-1.5 bg-white/[0.12]'
                }`}
              />
            ))}
          </div>
        </div>

        <Link
          href="/home"
          className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors py-1.5 px-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Exit
        </Link>
      </header>

      {/* =========================================================================
          MAIN CONTAINER: GUIDED DECISION VIEWPORT
          ========================================================================= */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 my-auto flex flex-col items-center">
        {/* =====================================================================
            SCREEN 1: GOAL ("What do you want to achieve?")
            ===================================================================== */}
        {currentStep === 0 && (
          <div className="w-full space-y-6 transition-all duration-200">
            <div className="text-center space-y-1.5">
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                What do you want to achieve?
              </h1>
              <p className="font-sans text-sm text-slate-400 max-w-md mx-auto">
                Every expedition starts with a destination. Xira will use this to shape your learning journey.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {GOAL_OPTIONS.map((goal) => {
                const IconComponent = goal.icon;
                const isSelected = selectedGoal === goal.id;

                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoal(goal.id)}
                    aria-pressed={isSelected}
                    className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-[#141826]/90 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#181D2E] text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/[0.05] text-slate-400 border border-white/[0.06]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="font-sans font-semibold text-base sm:text-[17px] text-[#F8FAFC]">
                          {goal.title}
                        </h2>
                        <p className="font-sans text-xs sm:text-sm text-slate-400 mt-0.5 leading-snug">
                          {goal.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-white/[0.2] bg-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedGoal}
                className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            SCREEN 2: INTERESTS ("What are you curious about?")
            ===================================================================== */}
        {currentStep === 1 && (
          <div className="w-full space-y-6 transition-all duration-200">
            <div className="text-center space-y-1.5">
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                What are you curious about?
              </h1>
              <p className="font-sans text-sm text-slate-400 max-w-md mx-auto">
                Choose the areas you want your expedition to explore. Select at least 1.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {INTEREST_OPTIONS.map((interest) => {
                const IconComponent = interest.icon;
                const isSelected = selectedInterests.includes(interest.id);

                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    aria-pressed={isSelected}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                        : 'bg-[#141826]/90 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#181D2E] text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/[0.05] text-slate-400 border border-white/[0.06]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-white/[0.2] bg-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <h2 className="font-sans font-semibold text-base text-[#F8FAFC]">
                        {interest.title}
                      </h2>
                      <p className="font-sans text-xs text-slate-400 mt-0.5 leading-snug">
                        {interest.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedInterests.length === 0}
                className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            SCREEN 3: SUBJECTS ("Where do you want to learn?")
            ===================================================================== */}
        {currentStep === 2 && (
          <div className="w-full space-y-6 transition-all duration-200">
            <div className="text-center space-y-1.5">
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                Where do you want to learn?
              </h1>
              <p className="font-sans text-sm text-slate-400 max-w-md mx-auto">
                Pick the worlds you&apos;d like Xira to build into your journey. Select at least 1.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {SUBJECT_OPTIONS.map((subject) => {
                const IconComponent = subject.icon;
                const isSelected = selectedSubjects.includes(subject.id);

                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    aria-pressed={isSelected}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                        : 'bg-[#141826]/90 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#181D2E] text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/[0.05] text-slate-400 border border-white/[0.06]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="font-sans font-semibold text-base text-[#F8FAFC]">
                          {subject.title}
                        </h2>
                        <p className="font-sans text-xs text-slate-400 mt-0.5 leading-snug">
                          {subject.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-white/[0.2] bg-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedSubjects.length === 0}
                className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            SCREEN 4: LEARNING TIME ("How much time can you give your expedition?")
            ===================================================================== */}
        {currentStep === 3 && (
          <div className="w-full space-y-6 transition-all duration-200">
            <div className="text-center space-y-1.5">
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                How much time can you give your expedition?
              </h1>
              <p className="font-sans text-sm text-slate-400 max-w-md mx-auto">
                Xira will use this to shape your learning rhythm and quest sizing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {TIME_OPTIONS.map((opt) => {
                const isSelected = selectedMinutes === opt.minutes;

                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => setSelectedMinutes(opt.minutes)}
                    aria-pressed={isSelected}
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                        : 'bg-[#141826]/90 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#181D2E] text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                        {opt.tier}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-white/[0.2] bg-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <h2 className="font-sans font-bold text-xl text-[#F8FAFC]">
                        {opt.label}
                      </h2>
                      <p className="font-sans text-xs sm:text-sm text-slate-400 mt-1 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            SCREEN 5: LEVEL ("Where are you starting from?")
            ===================================================================== */}
        {currentStep === 4 && (
          <div className="w-full space-y-6 transition-all duration-200">
            <div className="text-center space-y-1.5">
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                Where are you starting from?
              </h1>
              <p className="font-sans text-sm text-slate-400 max-w-md mx-auto">
                Your starting point helps Xira choose the right first challenge without boring you or overwhelming you.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {LEVEL_OPTIONS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.id)}
                    aria-pressed={isSelected}
                    className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-[#141826]/90 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#181D2E] text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/[0.05] text-slate-400 border border-white/[0.06]'
                        }`}
                      >
                        <Gauge className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="font-sans font-semibold text-base sm:text-[17px] text-[#F8FAFC]">
                          {lvl.title}
                        </h2>
                        <p className="font-sans text-xs sm:text-sm text-slate-400 mt-0.5 leading-snug">
                          {lvl.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-white/[0.2] bg-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] cursor-pointer"
              >
                <span>Continue to Summary</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            SCREEN 6: FINAL CONFIRMATION & EXPEDITION LAUNCH
            ===================================================================== */}
        {currentStep === 5 && (
          <div className="w-full space-y-6 transition-all duration-200">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
                <Compass className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              </div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                Your Expedition is Ready
              </h1>
              <p className="font-sans text-sm text-slate-400 max-w-md mx-auto">
                Xira will use this to shape your first challenges and calibrate your skill graph.
              </p>
            </div>

            {/* Expedition Summary Card */}
            <div className="p-5 sm:p-6 bg-[#141826]/95 border border-white/[0.08] rounded-2xl space-y-4 shadow-xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Expedition Goal</span>
                <span className="font-sans font-semibold text-sm text-indigo-400">{activeGoal?.title}</span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Learning Worlds</span>
                <span className="font-sans font-semibold text-sm text-[#F8FAFC] max-w-[220px] text-right truncate">
                  {activeSubjectNames || 'Programming'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Daily Rhythm</span>
                <span className="font-sans font-semibold text-sm text-[#F8FAFC]">{activeTime?.label}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Starting Tier</span>
                <span className="font-sans font-semibold text-sm text-[#F8FAFC]">{activeLevel?.title}</span>
              </div>
            </div>

            {/* Status Notice during submission */}
            {statusMessage && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs font-mono text-indigo-300 text-center animate-pulse">
                {statusMessage}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleBeginExpedition}
                disabled={isSubmitting}
                className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Preparing Calibration...</span>
                  </span>
                ) : (
                  <>
                    <span>Begin My Expedition</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="text-center font-sans text-xs text-slate-500">
                Next: A quick 3-minute baseline calibration to measure what you know without AI assistance.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MINIMALIST FOOTER
          ========================================================================= */}
      <footer className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-[12px] font-sans text-slate-500 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <span>© {new Date().getFullYear()} XPedition</span>
        <Link href="/terms" className="hover:text-slate-400 transition-colors underline-offset-4 hover:underline">
          Terms & Privacy
        </Link>
      </footer>
    </div>
  );
}
