'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, saveLearnerProfile, LearnerProfileData, applySeededCourse, createNewSkillGraph, setGraphContent } from '@/lib/store';
import { SEEDED_PYTHON_COURSE } from '@/lib/seed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type PathType = 'goal' | 'syllabus';
type LanguageType = 'english' | 'tanglish' | 'tamil';

export default function OnboardingPage() {
  const router = useRouter();

  // Intake State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [pathType, setPathType] = useState<PathType>('goal');
  const [topic, setTopic] = useState<string>('');
  const [language, setLanguage] = useState<LanguageType>('english');
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [startingLevel, setStartingLevel] = useState<string>('Complete beginner');
  
  // Goal Path specific
  const [whyGoal, setWhyGoal] = useState<string>('Job');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  
  // Syllabus Path specific
  const [testDate, setTestDate] = useState<string>('');
  const [syllabusText, setSyllabusText] = useState<string>('');
  const [isExtractingFile, setIsExtractingFile] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingFile(true);
    setUploadStatus(`Extracting text from ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-syllabus', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.text) {
        setSyllabusText(data.text);
        setUploadStatus(`✓ Extracted ${data.text.length} characters from ${file.name}`);
        updateProfileStep(6, { syllabusText: data.text });
      } else {
        setUploadStatus(data.error || data.warning || 'Could not extract text automatically. Please paste topics manually.');
      }
    } catch (err) {
      setUploadStatus('File processing failed. Please paste topics manually below.');
    } finally {
      setIsExtractingFile(false);
    }
  };

  // Generated Plan & Mode State
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [studyPlan, setStudyPlan] = useState<{
    totalHours: number;
    weeks: number;
    topics: { id: string; title: string; hours: number; why: string }[];
    milestones: { afterTopic: string; checkpoint: string }[];
    guidance?: string;
  } | null>(null);

  const [tutorNoticeOpen, setTutorNoticeOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Resume step on mount
  useEffect(() => {
    const store = getStoreData();
    if (store.learnerProfile) {
      const p = store.learnerProfile;
      setPathType(p.pathType || 'goal');
      setTopic(p.topic || '');
      setLanguage(p.language || 'english');
      setDailyMinutes(p.dailyMinutes || 60);
      setStartingLevel(p.startingLevel || 'Complete beginner');
      setWhyGoal(p.whyGoal || 'Job');
      setDeadlineDate(p.deadlineDate || '');
      setTestDate(p.testDate || '');
      setSyllabusText(p.syllabusText || '');
      if (p.currentStep && p.currentStep < 8) {
        setCurrentStep(p.currentStep);
      }
      if (p.studyPlan) {
        setStudyPlan(p.studyPlan);
      }
    }
  }, []);

  // Save progress step locally
  const updateProfileStep = (newStep: number, profileData?: Partial<LearnerProfileData>) => {
    setCurrentStep(newStep);
    const updated = saveLearnerProfile({
      pathType,
      topic,
      language,
      dailyMinutes,
      startingLevel,
      whyGoal,
      deadlineDate,
      testDate,
      syllabusText,
      currentStep: newStep,
      studyPlan: studyPlan || undefined,
      ...profileData,
    });

    // Best-effort database sync to learner_profile table
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.auth.getUser().then(({ data }) => {
        if (data?.user) {
          client.from('learner_profile').upsert({
            user_id: data.user.id,
            path_type: updated.learnerProfile?.pathType,
            topic: updated.learnerProfile?.topic || 'Python Programming',
            language: updated.learnerProfile?.language,
            daily_minutes: updated.learnerProfile?.dailyMinutes,
            starting_level: updated.learnerProfile?.startingLevel,
            why_goal: updated.learnerProfile?.whyGoal,
            deadline_date: updated.learnerProfile?.deadlineDate || null,
            test_date: updated.learnerProfile?.testDate || null,
            syllabus_text: updated.learnerProfile?.syllabusText || null,
            current_step: newStep,
            updated_at: new Date().toISOString(),
          }).then(() => {});
        }
      });
    }
  };

  const handleNextStep = async () => {
    const totalSteps = 7; // Step 0 to 8
    const next = currentStep + 1;

    // Trigger plan generation on step 6 before rendering step 7
    if (currentStep === 6) {
      setIsGeneratingPlan(true);
      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pathType,
            topic: topic.trim() || 'Python Programming',
            language,
            dailyMinutes,
            startingLevel,
            whyGoal,
            deadlineDate,
            testDate,
            syllabusText,
          }),
        });

        if (res.ok) {
          const planData = await res.json();
          setStudyPlan(planData);
          updateProfileStep(7, { studyPlan: planData });
        } else {
          updateProfileStep(7);
        }
      } catch (err) {
        updateProfileStep(7);
      } finally {
        setIsGeneratingPlan(false);
      }
      return;
    }

    updateProfileStep(next);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      updateProfileStep(currentStep - 1);
    }
  };

  // Final course generation and routing into Tutor or Quest Mode / Calibrate
  const handleFinalizeMode = async (mode: 'tutor' | 'quest') => {
    setIsSubmitting(true);
    setStatusNotice('Generating skill graph course...');

    const finalGoalTopic = topic.trim() || 'Python Core & Data Structures';

    // Create a new skill graph object so existing graphs are never destroyed
    createNewSkillGraph(finalGoalTopic);
    saveLearnerProfile({ learningMode: mode, language: language as any });

    try {
      const res = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: finalGoalTopic }),
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
          setGraphContent(finalGoalTopic, formattedConcepts, data.quests, false);
        } else {
          setStatusNotice('Using our starter Python path for now.');
          applySeededCourse(finalGoalTopic, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
        }
      } else {
        setStatusNotice('Using our starter Python path for now.');
        applySeededCourse(finalGoalTopic, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
      }
    } catch (err) {
      setStatusNotice('Using our starter Python path for now.');
      applySeededCourse(finalGoalTopic, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        const store = getStoreData();
        const firstConceptId = store.concepts[0]?.id || 'c_1';
        if (mode === 'tutor') {
          router.push(`/tutor/${encodeURIComponent(firstConceptId)}`);
        } else {
          router.push('/calibrate');
        }
      }, 600);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Neon Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-[#120E22]/90 border border-line rounded-[20px] p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        
        {/* Header Action Bar with Working Back Arrow & Cancel */}
        <div className="flex items-center justify-between border-b border-line/60 pb-3.5">
          <div className="flex items-center gap-3">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="font-mono text-xs text-muted hover:text-text flex items-center gap-1 transition-colors cursor-pointer"
              >
                ← Back
              </button>
            ) : (
              <span className="font-mono text-[10px] tracking-eyebrow text-cyan uppercase font-bold">
                TUTOR INTAKE
              </span>
            )}
          </div>

          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === currentStep
                    ? 'w-6 bg-cyan'
                    : s < currentStep
                    ? 'w-2 bg-violet font-bold'
                    : 'w-1.5 bg-line/80'
                }`}
              />
            ))}
          </div>

          <Link href="/home" className="font-mono text-xs text-muted hover:text-text transition-colors">
            ✕ Exit
          </Link>
        </div>

        {/* Status Notice Banner */}
        {statusNotice && (
          <div className="p-3 bg-cyan/15 border border-cyan/40 rounded-[10px] text-xs font-mono text-cyan text-center">
            {statusNotice}
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 0: THE FORK CHOICE (Goal vs Syllabus) */}
        {/* =================================================================== */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-1.5">
              <h1 className="font-sans font-semibold text-xl sm:text-2xl text-text">
                What brings you here today?
              </h1>
              <p className="font-sans text-xs text-muted">
                Choose the path that fits your current objective best.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* GOAL CARD */}
              <button
                type="button"
                onClick={() => {
                  setPathType('goal');
                  updateProfileStep(1, { pathType: 'goal' });
                }}
                className="bg-[#1A1430]/85 border border-white/[0.09] hover:border-violet-hot p-5 rounded-[16px] text-left transition-all hover:bg-[#1A1430] group cursor-pointer space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-violet/20 text-violet flex items-center justify-center font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-base text-text group-hover:text-violet-hot transition-colors">
                    Learning something new
                  </h3>
                  <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                    Measured in weeks or months. Build deep foundations for a job, project, or long-term skill.
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase text-cyan font-semibold block pt-1">
                  Goal Path →
                </span>
              </button>

              {/* SYLLABUS CARD */}
              <button
                type="button"
                onClick={() => {
                  setPathType('syllabus');
                  updateProfileStep(1, { pathType: 'syllabus' });
                }}
                className="bg-[#1A1430]/85 border border-white/[0.09] hover:border-cyan p-5 rounded-[16px] text-left transition-all hover:bg-[#1A1430] group cursor-pointer space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                  📚
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-base text-text group-hover:text-cyan transition-colors">
                    Preparing for a test
                  </h3>
                  <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                    Measured in days. Focused coverage on exact exam units and upcoming test topics.
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase text-violet-hot font-semibold block pt-1">
                  Syllabus Path →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 1: WHAT DO YOU WANT TO LEARN? */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 1 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                {pathType === 'goal' ? 'What do you want to learn?' : 'What subject or test are you preparing for?'}
              </h1>
            </div>

            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-[52px] px-4 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[16px] font-sans text-text focus:outline-none focus:border-cyan"
              placeholder={pathType === 'goal' ? 'e.g. Python for job at Zoho' : 'e.g. Data Structures Unit 1 to 3'}
              autoFocus
            />

            <button
              type="button"
              disabled={!topic.trim()}
              onClick={handleNextStep}
              className="w-full h-[50px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer disabled:opacity-40"
            >
              <span>Continue</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: WHICH LANGUAGE SHOULD I TEACH IN? */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 2 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                Which language should I teach in?
              </h1>
              <p className="font-sans text-xs text-muted">
                Tanglish = Tamil written in Latin script, with technical terms in English.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'english', label: 'English', desc: 'Standard technical English instruction' },
                { id: 'tanglish', label: 'Tanglish (தமிழ் + English)', desc: 'Tamil in Latin script + English terms' },
                { id: 'tamil', label: 'தமிழ் (Tamil)', desc: 'Full Tamil language explanations' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setLanguage(item.id as LanguageType);
                    updateProfileStep(3, { language: item.id as LanguageType });
                  }}
                  className={`w-full p-4 rounded-[12px] border text-left font-sans transition-all cursor-pointer ${
                    language === item.id
                      ? 'bg-cyan/15 border-cyan text-cyan font-semibold'
                      : 'bg-[#1A1430]/85 border-white/[0.09] text-text hover:border-cyan'
                  }`}
                >
                  <span className="block font-medium text-[15px]">{item.label}</span>
                  <span className="block font-mono text-[11px] text-muted mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: DAILY TIME COMMITMENT */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 3 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                How much time can you give per day?
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { minutes: 15, label: '15 min / day', desc: 'Casual pace' },
                { minutes: 30, label: '30 min / day', desc: 'Steady pace' },
                { minutes: 60, label: '1 hr / day', desc: 'Focused pace' },
                { minutes: 120, label: '2 hr+ / day', desc: 'Intense pace' },
              ].map((item) => (
                <button
                  key={item.minutes}
                  type="button"
                  onClick={() => {
                    setDailyMinutes(item.minutes);
                    updateProfileStep(4, { dailyMinutes: item.minutes });
                  }}
                  className={`p-4 rounded-[12px] border text-left font-sans transition-all cursor-pointer ${
                    dailyMinutes === item.minutes
                      ? 'bg-signature-gradient text-white border-cyan font-semibold'
                      : 'bg-[#1A1430]/85 border-white/[0.09] text-text hover:border-cyan'
                  }`}
                >
                  <span className="block font-semibold text-[15px]">{item.label}</span>
                  <span className="block font-mono text-[10px] opacity-80 mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 4: STARTING KNOWLEDGE LEVEL */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 4 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                Where are you starting from?
              </h1>
            </div>

            <div className="space-y-2.5">
              {[
                'Complete beginner',
                'Know the basics',
                'Know it, need to go deeper',
              ].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setStartingLevel(lvl);
                    updateProfileStep(5, { startingLevel: lvl });
                  }}
                  className={`w-full p-4 rounded-[12px] border text-left font-sans text-[15px] transition-all cursor-pointer ${
                    startingLevel === lvl
                      ? 'bg-cyan/15 border-cyan text-cyan font-semibold'
                      : 'bg-[#1A1430]/85 border-white/[0.09] text-text hover:border-cyan'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 5: PATH SPECIFIC QUESTION 1 */}
        {/* =================================================================== */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-fadeIn">
            {pathType === 'goal' ? (
              <>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                    QUESTION 5 OF 6 (GOAL PATH)
                  </span>
                  <h1 className="font-sans font-semibold text-xl text-text">
                    Why this goal?
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['Job', 'Exam', 'Curiosity', 'College work'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setWhyGoal(opt);
                        updateProfileStep(6, { whyGoal: opt });
                      }}
                      className={`p-4 rounded-[12px] border text-center font-sans text-sm transition-all cursor-pointer ${
                        whyGoal === opt
                          ? 'bg-signature-gradient text-white border-cyan font-semibold'
                          : 'bg-[#1A1430]/85 border-white/[0.09] text-text hover:border-cyan'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                    QUESTION 5 OF 6 (SYLLABUS PATH)
                  </span>
                  <h1 className="font-sans font-semibold text-xl text-text">
                    When is the test?
                  </h1>
                </div>

                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full h-[52px] px-4 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[16px] font-sans text-text focus:outline-none focus:border-cyan"
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => updateProfileStep(6)}
                    className="font-mono text-xs text-muted hover:text-text"
                  >
                    Skip for now
                  </button>

                  <button
                    type="button"
                    disabled={!testDate}
                    onClick={handleNextStep}
                    className="h-[46px] px-6 rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center gap-2 hover:brightness-108 disabled:opacity-40"
                  >
                    <span>Next</span>
                    <span>→</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 6: PATH SPECIFIC QUESTION 2 */}
        {/* =================================================================== */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-fadeIn">
            {pathType === 'goal' ? (
              <>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                    QUESTION 6 OF 6 (GOAL PATH)
                  </span>
                  <h1 className="font-sans font-semibold text-xl text-text">
                    Any target deadline?
                  </h1>
                </div>

                <div className="space-y-3">
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full h-[52px] px-4 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[16px] font-sans text-text focus:outline-none focus:border-cyan"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeadlineDate('');
                        handleNextStep();
                      }}
                      className="font-mono text-xs text-muted hover:text-text cursor-pointer"
                    >
                      No deadline / Skip
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="h-[46px] px-6 rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center gap-2 hover:brightness-108 cursor-pointer"
                    >
                      <span>Generate Study Plan</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                    QUESTION 6 OF 6 (SYLLABUS PATH)
                  </span>
                  <h1 className="font-sans font-semibold text-xl text-text">
                    What is on the test?
                  </h1>
                  <p className="font-sans text-xs text-muted">
                    Paste units/topics manually OR upload a syllabus document (PDF, DOCX, JPG, PNG up to 5MB).
                  </p>
                </div>

                {/* File Upload Dropzone / Button */}
                <div className="bg-[#1A1430]/60 border border-dashed border-line/80 p-3.5 rounded-[12px] flex items-center justify-between gap-3">
                  <div className="text-xs font-sans text-muted">
                    {uploadStatus ? (
                      <span className="text-cyan font-mono">{uploadStatus}</span>
                    ) : (
                      <span>Upload document (PDF, DOCX, JPG, PNG &le; 5MB)</span>
                    )}
                  </div>

                  <label className="h-8 px-3 rounded-[8px] bg-raised border border-line text-xs font-sans text-text font-medium hover:border-cyan transition-colors cursor-pointer shrink-0 flex items-center gap-1">
                    <span>{isExtractingFile ? 'Extracting...' : '📄 Upload File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt"
                      disabled={isExtractingFile}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={4}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  className="w-full p-3.5 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[15px] font-sans text-text focus:outline-none focus:border-cyan"
                  placeholder="e.g. Unit 1: Arrays, Unit 2: Stack & Queue, Unit 3: Tree traversals"
                />

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-[50px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer"
                >
                  <span>Generate Exam Plan</span>
                  <span>→</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 7: THE STUDY PLAN DISPLAY */}
        {/* =================================================================== */}
        {currentStep === 7 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1 border-b border-line/60 pb-3">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                PERSONALIZED STUDY ESTIMATE
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                Your Learning Roadmap
              </h1>
            </div>

            {isGeneratingPlan ? (
              <div className="py-12 text-center space-y-3">
                <div className="font-mono text-sm text-cyan animate-pulse">
                  ⟳ Calculating realistic timeline with Groq...
                </div>
                <p className="font-sans text-xs text-muted">
                  Grounding estimates in your pace of {dailyMinutes} mins/day
                </p>
              </div>
            ) : studyPlan ? (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {/* Guidance Banner */}
                {studyPlan.guidance && (
                  <div className="p-3.5 bg-violet/15 border border-violet/30 rounded-[12px] font-sans text-xs text-text/90 leading-relaxed">
                    💡 <span className="font-semibold text-violet-hot">Honest Estimate:</span> {studyPlan.guidance}
                  </div>
                )}

                {/* Plan Overview Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#150F2A] p-3 rounded-[12px] text-center">
                    <span className="block font-mono text-[9px] uppercase text-muted">TOTAL HOURS</span>
                    <span className="block font-mono text-xl font-bold text-cyan">{studyPlan.totalHours} hrs</span>
                  </div>
                  <div className="bg-[#150F2A] p-3 rounded-[12px] text-center">
                    <span className="block font-mono text-[9px] uppercase text-muted">ESTIMATED WEEKS</span>
                    <span className="block font-mono text-xl font-bold text-violet">{studyPlan.weeks} weeks</span>
                  </div>
                </div>

                {/* Topic Rationale List */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold block">
                    RECOMMENDED TOPICS
                  </span>

                  {studyPlan.topics.map((t) => (
                    <div key={t.id} className="bg-[#150F2A] p-3.5 rounded-[12px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-medium text-sm text-text">{t.title}</span>
                        <span className="font-mono text-xs text-cyan font-bold">{t.hours} hrs</span>
                      </div>
                      <p className="font-sans text-xs text-muted leading-snug">{t.why}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => updateProfileStep(8)}
                  className="w-full h-[50px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer mt-2"
                >
                  <span>Choose Learning Mode</span>
                  <span>→</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 8: MODE CHOICE (TUTOR vs QUEST) */}
        {/* =================================================================== */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-1.5">
              <h1 className="font-sans font-semibold text-xl text-text">
                How do you want to learn?
              </h1>
              <p className="font-sans text-xs text-muted">
                Select your preferred mode for this skill graph.
              </p>
            </div>

            <div className="space-y-3">
              {/* TUTOR MODE */}
              <button
                type="button"
                onClick={() => handleFinalizeMode('tutor')}
                className="w-full p-4 bg-[#1A1430]/85 border border-white/[0.09] hover:border-violet-hot rounded-[14px] text-left transition-all hover:bg-[#1A1430] group cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold text-base text-text group-hover:text-violet-hot">
                    TUTOR MODE
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-violet/20 text-violet font-bold uppercase">
                    Interactive
                  </span>
                </div>
                <p className="font-sans text-xs text-muted">
                  "I'll teach you, then test you" — Interactive lessons, AI tutor guidance, and structured practice.
                </p>
              </button>

              {/* QUEST MODE */}
              <button
                type="button"
                onClick={() => handleFinalizeMode('quest')}
                className="w-full p-4 bg-[#1A1430]/85 border border-white/[0.09] hover:border-cyan rounded-[14px] text-left transition-all hover:bg-[#1A1430] group cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold text-base text-text group-hover:text-cyan">
                    QUEST MODE
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan/20 text-cyan font-bold uppercase">
                    Direct Practice
                  </span>
                </div>
                <p className="font-sans text-xs text-muted">
                  "Just give me the questions" — Adaptive focus-mode runs, instant telemetry feedback, and calibration.
                </p>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
