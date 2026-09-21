'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Badge,
  ProgressBar,
  StatCard,
  CircularProgress,
  ClassStageIndicator,
  BuddySpeech,
  BuddyMood,
  XiraCard,
  Drawer,
  Input,
  Slider,
  Toggle,
  FeedbackBanner,
  Skeleton,
} from '@/components/ui';
import { XP_COLORS, ClassStageKey } from '@/lib/design-system/tokens';
import {
  Sparkles,
  Flame,
  Award,
  BookOpen,
  Compass,
  Volume2,
  FileText,
  Calculator,
  Bot,
  HelpCircle,
  Sliders,
  Layers,
  ArrowRight,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function DesignSystemPage() {
  // State for interactive showcase demonstrations
  const [activeStageKey, setActiveStageKey] = useState<ClassStageKey>('explore');
  const [stageIndex, setStageIndex] = useState(3);
  const [buddyMood, setBuddyMood] = useState<BuddyMood>('speaking');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [sliderAngle, setSliderAngle] = useState(45);
  const [toggleState, setToggleState] = useState(true);
  const [searchVal, setSearchVal] = useState('Projectile Motion');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'formula' | 'notes' | 'xira'>('formula');

  const STAGES_LIST: ClassStageKey[] = [
    'intro',
    'explain',
    'explore',
    'predict',
    'interact',
    'observe',
    'check',
    'mission',
    'challenge',
    'assessment',
    'feedback',
    'reward',
    'next',
  ];

  const handleNextStage = () => {
    const nextIdx = (stageIndex % STAGES_LIST.length) + 1;
    setStageIndex(nextIdx);
    setActiveStageKey(STAGES_LIST[nextIdx - 1]);
  };

  const handlePrevStage = () => {
    const prevIdx = stageIndex > 1 ? stageIndex - 1 : STAGES_LIST.length;
    setStageIndex(prevIdx);
    setActiveStageKey(STAGES_LIST[prevIdx - 1]);
  };

  return (
    <main className="min-h-screen bg-[#060B18] text-[#F8FAFC] px-4 py-8 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
      {/* Header Banner */}
      <header className="space-y-3 border-b border-white/[0.08] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center font-mono font-bold text-white shadow-lg shadow-indigo-500/30">
              XP
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-white">
                Xpedition Design System
              </h1>
              <p className="text-xs sm:text-sm font-sans text-slate-400">
                Design 1 — Dark, Immersive, 3D Focus • Reusable Foundations
              </p>
            </div>
          </div>
          <Badge variant="3d" size="md">
            Tokens & UI Foundation V2
          </Badge>
        </div>
      </header>

      {/* 1. Color Palette & Surfaces */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            1. Surfaces & Color Palette
          </h2>
          <span className="text-xs font-mono text-slate-400">Obsidian & Midnight Blue</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-[#060B18] border border-white/[0.08] space-y-1">
            <div className="h-10 rounded-lg bg-[#060B18] border border-white/[0.1]" />
            <p className="font-mono text-xs font-bold text-white">Base BG</p>
            <p className="font-mono text-[10px] text-slate-500">#060B18</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0E152E] border border-white/[0.08] space-y-1">
            <div className="h-10 rounded-lg bg-[#0E152E]" />
            <p className="font-mono text-xs font-bold text-white">Surface</p>
            <p className="font-mono text-[10px] text-slate-500">#0E152E</p>
          </div>
          <div className="p-3 rounded-xl bg-[#141D3D] border border-white/[0.08] space-y-1">
            <div className="h-10 rounded-lg bg-[#141D3D]" />
            <p className="font-mono text-xs font-bold text-white">Elevated</p>
            <p className="font-mono text-[10px] text-slate-500">#141D3D</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0E152E] border border-indigo-500/40 space-y-1">
            <div className="h-10 rounded-lg bg-indigo-600 shadow-[0_0_16px_rgba(99,102,241,0.4)]" />
            <p className="font-mono text-xs font-bold text-white">Primary Brand</p>
            <p className="font-mono text-[10px] text-indigo-300">#6366F1</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0E152E] border border-sky-500/40 space-y-1">
            <div className="h-10 rounded-lg bg-sky-500 shadow-[0_0_16px_rgba(14,165,233,0.4)]" />
            <p className="font-mono text-xs font-bold text-white">Secondary Brand</p>
            <p className="font-mono text-[10px] text-sky-300">#0EA5E9</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0E152E] border border-amber-500/40 space-y-1">
            <div className="h-10 rounded-lg bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.3)]" />
            <p className="font-mono text-xs font-bold text-white">Warm Accent</p>
            <p className="font-mono text-[10px] text-amber-300">#F59E0B</p>
          </div>
        </div>

        {/* 13 Unified Learning Stages Palette */}
        <div className="p-4 rounded-2xl bg-[#0E152E]/80 border border-white/[0.08] space-y-3">
          <p className="font-sans font-semibold text-xs text-slate-300">
            Semantic Class Stages (13 Stages in Unified Learning Session)
          </p>
          <div className="flex flex-wrap gap-2">
            {STAGES_LIST.map((key) => {
              const stage = XP_COLORS.stage[key];
              const isSelected = activeStageKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveStageKey(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-white shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: stage.soft,
                    color: stage.color,
                    border: `1px solid ${stage.color}50`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Typography System */}
      <section className="space-y-4">
        <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          2. Typography Hierarchy
        </h2>
        <div className="p-5 rounded-2xl bg-[#0E152E]/90 border border-white/[0.08] space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-2">
            <span className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
              Display Heading / H1
            </span>
            <span className="text-xs font-mono text-slate-400">Inter Bold 30px</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-2">
            <span className="text-xl font-sans font-bold text-slate-100">
              H2 Section Title — Projectile Motion
            </span>
            <span className="text-xs font-mono text-slate-400">Inter SemiBold 20px</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-2">
            <p className="text-sm sm:text-base font-sans text-slate-300 leading-relaxed max-w-xl">
              Body text: Discover how initial launch angle and gravitational acceleration dictate the parabolic arc and maximum horizontal range.
            </p>
            <span className="text-xs font-mono text-slate-400">Inter Regular 15px</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-2xl text-amber-400">+120 XP</span>
              <span className="font-mono font-bold text-lg text-emerald-400">72% Mastery</span>
              <span className="font-mono font-semibold text-slate-400">Class 3 of 7</span>
            </div>
            <span className="text-xs font-mono text-slate-400">JetBrains Mono Tabular</span>
          </div>
        </div>
      </section>

      {/* 3. Button System */}
      <section className="space-y-4">
        <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          3. Button Variants & Touch Targets
        </h2>
        <div className="p-5 rounded-2xl bg-[#0E152E]/90 border border-white/[0.08] space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continue Class (Primary Glow)
            </Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Cyan Accent</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="skip">Skip for now →</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
            <span className="text-xs font-sans text-slate-400 font-semibold mr-2">Sizes:</span>
            <Button variant="primary" size="sm">
              Small (36px)
            </Button>
            <Button variant="primary" size="md">
              Medium (44px Touch Target)
            </Button>
            <Button variant="primary" size="lg">
              Large (48px)
            </Button>
            <Button variant="secondary" size="icon" aria-label="Play">
              <Play className="w-4 h-4" />
            </Button>
            <Button variant="primary" isLoading>
              Saving
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Progress System & Indicators */}
      <section className="space-y-4">
        <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          4. Progress System & Segmented Indicators
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Continuous Progress */}
          <Card variant="default" className="p-4 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400">
              Continuous Progress
            </h3>
            <ProgressBar value={72} label="Concept Mastery" variant="indigo" glowing />
            <ProgressBar value={45} label="Daily Goal" variant="cyan" />
            <ProgressBar value={90} label="Accuracy" variant="emerald" />
          </Card>

          {/* Segmented Stage Progress */}
          <Card variant="learning" className="p-4 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400">
              Class Stage Segments (Design 1)
            </h3>
            <ProgressBar
              segments={7}
              currentSegment={3}
              label="Projectile Motion"
              sublabel="Class 3 of 7"
              variant="indigo"
            />
            <div className="pt-2">
              <ClassStageIndicator
                currentStage={activeStageKey}
                stageIndex={stageIndex}
                totalStages={8}
                onNext={handleNextStage}
                onPrevious={handlePrevStage}
              />
            </div>
          </Card>

          {/* Circular Progress Gauge */}
          <Card variant="glass" className="p-4 flex items-center justify-around">
            <CircularProgress
              value={72}
              size={84}
              variant="indigo"
              label="Class Progress"
              sublabel="3/7 completed"
            />
            <CircularProgress
              value={88}
              size={84}
              variant="emerald"
              label="Accuracy"
              sublabel="Retention High"
            />
          </Card>
        </div>
      </section>

      {/* 5. Buddy (Embodied Companion) & Xira (Cognitive Brain) */}
      <section className="space-y-4">
        <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          5. Buddy & Xira AI Relationship
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Buddy Speech Bubble Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-sky-400">
                Buddy Speech Bubble (On Canvas)
              </span>
              <div className="flex items-center gap-1">
                {(['speaking', 'celebrating', 'encouraging', 'thinking', 'warning'] as BuddyMood[]).map(
                  (mood) => (
                    <button
                      key={mood}
                      onClick={() => setBuddyMood(mood)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-all ${
                        buddyMood === mood
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      {mood}
                    </button>
                  )
                )}
              </div>
            </div>

            <BuddySpeech
              mood={buddyMood}
              message="Great! Now let's see how angle affects the distance. Try adjusting the angle slider to hit the target at 45m."
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
            />
          </div>

          {/* Xira Insight Card Showcase */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-indigo-400">
              Xira Cognitive Insight (Home & Classroom)
            </span>
            <XiraCard
              type="suggestion"
              title="Xira Suggests"
              message="You're doing great! Try the interactive simulation to see how launch angle affects maximum range."
              actionLabel="Go to Class →"
              onAction={() => alert('Action clicked: Go to Class')}
              onDismiss={() => alert('Dismiss clicked')}
            />
          </div>
        </div>
      </section>

      {/* 6. Card System Showcase */}
      <section className="space-y-4">
        <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          6. Card Variants (Design 1)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subject Tile */}
          <Card variant="subject" className="p-4 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              ⚛️
            </div>
            <h4 className="font-sans font-bold text-sm text-white">Physics</h4>
            <p className="font-sans text-xs text-slate-400">12 Classes • 4 Badges</p>
          </Card>

          {/* Mission Card */}
          <Card variant="mission" className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Mission
            </div>
            <h4 className="font-sans font-bold text-sm text-white">Hit the Target</h4>
            <p className="font-sans text-xs text-slate-300">3 attempts remaining.</p>
          </Card>

          {/* Reward Card */}
          <Card variant="reward" className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-mono text-xs font-bold uppercase">
              <Award className="w-3.5 h-3.5" />
              Victory
            </div>
            <h4 className="font-sans font-bold text-sm text-white">Class Completed!</h4>
            <p className="font-mono text-xs text-amber-200">+100 XP • Streak +1</p>
          </Card>

          {/* Resource Card */}
          <Card variant="resource" className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-sky-400 font-mono text-xs font-bold uppercase">
              <FileText className="w-3.5 h-3.5" />
              Resource
            </div>
            <h4 className="font-sans font-bold text-sm text-white">Formula Sheet</h4>
            <p className="font-sans text-xs text-slate-400">Kinematic Equations</p>
          </Card>
        </div>

        {/* Journey Metric Snapshot Cards (Home Screen) */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            compact
            variant="streak"
            label="Day Streak"
            value="5"
            icon={<Flame className="w-5 h-5 text-amber-400" />}
          />
          <StatCard
            compact
            variant="xp"
            label="Total XP"
            value="1,240"
            icon={<Sparkles className="w-5 h-5 text-indigo-400" />}
          />
          <StatCard
            compact
            variant="achievement"
            label="Achievements"
            value="3"
            icon={<Award className="w-5 h-5 text-sky-400" />}
          />
        </div>
      </section>

      {/* 7. Interactive Controls & Forms */}
      <section className="space-y-4">
        <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          7. Inputs, Sliders & Direct Canvas Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <Input
              isSearch
              label="Subject Search"
              placeholder="Search subjects, topics..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onClear={() => setSearchVal('')}
            />
            <Toggle
              label="Low-Power 2D Fallback"
              description="Disable WebGL 3D on battery saving"
              checked={toggleState}
              onChange={setToggleState}
            />
          </div>

          <div className="space-y-3">
            <Slider
              label="Launch Angle"
              value={sliderAngle}
              min={0}
              max={90}
              step={5}
              unit="°"
              onChange={setSliderAngle}
            />
          </div>

          <div className="space-y-3">
            <label className="block font-sans text-xs font-semibold text-slate-300">
              Supporting Tools Drawer Test
            </label>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Calculator className="w-4 h-4 text-indigo-400" />}
                onClick={() => {
                  setDrawerType('formula');
                  setIsDrawerOpen(true);
                }}
              >
                Open Formula Sheet Drawer
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<FileText className="w-4 h-4 text-amber-400" />}
                onClick={() => {
                  setDrawerType('notes');
                  setIsDrawerOpen(true);
                }}
              >
                Open Sticky Notes Drawer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Educational Feedback Banners */}
      <section className="space-y-4">
        <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          8. Educational Feedback Banners (Calm & Informative)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FeedbackBanner
            type="correct"
            message="45° yields maximum range because sin(2θ) reaches its maximum at 90°."
          />
          <FeedbackBanner
            type="tryAgain"
            message="Your angle was too steep (75°), causing the projectile to fall short."
            actionLabel="Reset Cannon"
            onAction={() => alert('Resetting simulation')}
          />
          <FeedbackBanner
            type="hint"
            message="Consider what happens to the vertical vs. horizontal velocity components."
          />
        </div>
      </section>

      {/* 9. Performance Loading Skeletons */}
      <section className="space-y-4">
        <h2 className="text-lg font-sans font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          9. Performance Loading States (Lightweight Shimmer)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#0E152E]/70 border border-white/[0.06] space-y-3">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="85%" />
            <Skeleton variant="text" width="60%" />
            <div className="flex gap-2 pt-2">
              <Skeleton variant="button" />
              <Skeleton variant="button" width={80} />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0E152E]/70 border border-white/[0.06] space-y-3">
            <Skeleton variant="canvas" height={140} />
          </div>
        </div>
      </section>

      {/* Interactive Supporting Tool Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drawerType === 'formula' ? 'Formula Sheet' : 'Sticky Notes'}
        subtitle="Projectile Motion • Class 3 of 7"
        icon={drawerType === 'formula' ? <Calculator className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      >
        {drawerType === 'formula' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <span className="font-mono text-xs uppercase text-indigo-300 font-bold">
                Horizontal Range Formula
              </span>
              <p className="font-mono text-lg font-bold text-white tracking-wide">
                R = (v² · sin 2θ) / g
              </p>
              <p className="text-xs text-slate-400">
                Where <strong>v</strong> is initial velocity, <strong>θ</strong> is launch angle, and <strong>g</strong> is gravitational acceleration (9.8 m/s²).
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Back to Lesson
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Remember: 45° gives maximum range when air resistance is neglected.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Save & Close
            </Button>
          </div>
        )}
      </Drawer>
    </main>
  );
}
