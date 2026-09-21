'use client';

/**
 * Universal Teaching Engine — "Teach Me Anything" Entry Point
 *
 * Transforms any user topic into an appropriate, interactive learning experience.
 * Route: /teach
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopicResolver } from '@/lib/experience/topicResolver';
import { TopicExperienceComposer } from '@/lib/experience/topicExperienceComposer';
import { UniversalTeachingContainer } from '@/components/experience/UniversalTeachingContainer';
import { ClassroomLayout } from '@/components/classroom/ClassroomLayout';
import { CANONICAL_CLASSROOM_LESSONS } from '@/lib/classroom/classroomCatalog';
import { TeachingExperiencePlan } from '@/lib/experience/universalTopicTypes';
import {
  Sparkles,
  Search,
  Compass,
  Zap,
  ArrowRight,
  Layers,
  Atom,
  Flame,
  Activity,
  Cpu,
  Globe,
  Sliders,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

const SUGGESTED_TOPICS = [
  { label: "Newton's Laws of Motion", subject: 'Physics', icon: '⚡' },
  { label: 'Photosynthesis & Chloroplasts', subject: 'Biology', icon: '🍃' },
  { label: "Electric Circuits & Ohm's Law", subject: 'Physics', icon: '💡' },
  { label: 'DC Electric Motor & Commutation', subject: 'Physics', icon: '⚙️' },
  { label: 'Solar System & Planetary Orbits', subject: 'Astronomy', icon: '🪐' },
  { label: 'Visual Fractions & Proportions', subject: 'Mathematics', icon: '🥧' },
  { label: 'DNA Double Helix Replication', subject: 'Biology', icon: '🧬' },
  { label: 'Human Heart Anatomy', subject: 'Biology', icon: '❤️' },
  { label: 'Projectile Motion', subject: 'Physics', icon: '🎯' },
  { label: 'Sorting Algorithms (Bubble & Quick)', subject: 'Computer Science', icon: '💻' },
  { label: 'Market Supply & Demand', subject: 'Economics', icon: '📈' },
  { label: 'English Sentence Structure', subject: 'Language & Grammar', icon: '📝' },
  { label: 'Why Does Inflation Happen?', subject: 'Economics', icon: '💵' },
  { label: 'Quantum Wave Functions', subject: 'Physics', icon: '⚛️' },
];

export default function TeachMePage() {
  const searchParams = useSearchParams();
  const initialTopicQuery = searchParams.get('topic') || '';

  const [inputTopic, setInputTopic] = useState(initialTopicQuery);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [activePlan, setActivePlan] = useState<TeachingExperiencePlan | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Auto-launch if topic query param is provided
  useEffect(() => {
    if (initialTopicQuery && !activePlan) {
      handleLaunchTopic(initialTopicQuery);
    }
  }, [initialTopicQuery]);

  const handleLaunchTopic = (topicText: string) => {
    const trimmed = topicText.trim();
    if (!trimmed) return;

    setIsResolving(true);

    // Instant deterministic resolution (< 50ms)
    const resolvedTopic = TopicResolver.resolveTopic(trimmed, {
      subject: selectedSubject !== 'All' ? selectedSubject : undefined,
    });

    const teachingPlan = TopicExperienceComposer.composeTeachingPlan(resolvedTopic);

    setActivePlan(teachingPlan);
    setIsResolving(false);
  };

  const handleReset = () => {
    setActivePlan(null);
    setInputTopic('');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 md:p-8 flex flex-col items-center">
      {/* Top Bar Header */}
      <div className="w-full max-w-6xl flex items-center justify-between pb-6 mb-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>UNIVERSAL TEACHING ENGINE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AI + 3D
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Learn by doing. Any topic becomes an interactive experience.
            </p>
          </div>
        </div>

        {activePlan && (
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            ← Explore New Topic
          </button>
        )}
      </div>

      {/* Main Container */}
      {!activePlan ? (
        <div className="w-full max-w-3xl flex flex-col items-center text-center gap-8 py-8 animate-fadeIn">
          {/* Hero Pitch */}
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mx-auto">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Universal Topic → Interactive Experience</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              What do you want to <span className="text-cyan-400">learn</span> today?
            </h2>
            <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              Type any scientific, mathematical, or computational concept. Xpedition creates the optimal
              3D simulation, interactive lab, or visual challenge for you to experiment with.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="w-full relative shadow-2xl">
            <div className="flex items-center bg-slate-950/90 border-2 border-cyan-500/40 focus-within:border-cyan-400 rounded-2xl p-2 transition-all shadow-lg shadow-cyan-500/10">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLaunchTopic(inputTopic)}
                placeholder="e.g. Newton's Laws, Photosynthesis, Electric Circuits, Solar System..."
                className="w-full bg-transparent px-4 py-3 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => handleLaunchTopic(inputTopic)}
                disabled={!inputTopic.trim() || isResolving}
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs md:text-sm font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-colors shrink-0"
              >
                <span>Launch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="w-full flex flex-col gap-3 text-left">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Popular Interactive Topics:
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputTopic(t.label);
                    handleLaunchTopic(t.label);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>{t.icon}</span>
                  <span className="font-medium">{t.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({t.subject})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Core Guarantees Banner */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10 text-left">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-1">
              <span className="text-xs font-mono text-cyan-400 font-bold">1. NOT A CHATBOT</span>
              <p className="text-xs text-slate-400">
                Direct interactive 3D simulations and manipulable visual experiments.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-1">
              <span className="text-xs font-mono text-emerald-400 font-bold">2. ZERO LAG START</span>
              <p className="text-xs text-slate-400">
                Instant deterministic topic resolution without waiting for multiple LLM calls.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-1">
              <span className="text-xs font-mono text-amber-400 font-bold">3. ADAPTIVE LOOP</span>
              <p className="text-xs text-slate-400">
                Learner actions update canonical BKT mastery and drive subsequent quests.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full animate-fadeIn">
          {activePlan && (
            activePlan.topic.topicId === 'dc_motor' ||
            activePlan.topic.rawUserTopic.toLowerCase().includes('motor') ||
            activePlan.topic.rawUserTopic.toLowerCase().includes('electric') ||
            Boolean(CANONICAL_CLASSROOM_LESSONS[activePlan.topic.topicId]) ? (
              <ClassroomLayout
                conceptId={activePlan.topic.topicId || 'dc_motor'}
                backHref="/teach"
                onClassComplete={() => handleReset()}
              />
            ) : (
              <UniversalTeachingContainer plan={activePlan} />
            )
          )}
        </div>
      )}
    </div>
  );
}
