'use client';

import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  FeedbackBanner,
  BuddySpeech,
  BuddyMood,
  XiraCard,
} from '@/components/ui';
import { BuddyPresence } from '@/components/buddy/BuddyPresence';
import { BuddyState } from '@/components/buddy/BuddyState';
import { ClassSessionData, ClassStageId } from '@/lib/class/types';
import {
  Sparkles,
  Target,
  Trophy,
  Award,
  ArrowRight,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Flame,
  Brain,
  RotateCcw,
} from 'lucide-react';

export interface ClassStageOverlayProps {
  stage: ClassStageId;
  data: ClassSessionData;
  angle: number;
  velocity: number;
  isLaunching: boolean;
  onFireExperiment?: () => void;
  onAdvanceStage: () => void;
  className?: string;
}

export const ClassStageOverlay: React.FC<ClassStageOverlayProps> = ({
  stage,
  data,
  angle,
  velocity,
  isLaunching,
  onFireExperiment,
  onAdvanceStage,
  className = '',
}) => {
  // Local prediction state
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);

  // Local quick check state
  const [selectedCheckOption, setSelectedCheckOption] = useState<number | null>(null);
  const [isCheckSubmitted, setIsCheckSubmitted] = useState(false);

  // Local mission attempts counter
  const [missionAttempts, setMissionAttempts] = useState(1);

  // Local assessment state
  const [selectedAssessmentOption, setSelectedAssessmentOption] = useState<number | null>(null);
  const [isAssessmentSubmitted, setIsAssessmentSubmitted] = useState(false);

  // 1. INTRODUCE STAGE OVERLAY
  if (stage === 'introduce') {
    return (
      <div className={`p-4 sm:p-6 max-w-xl mx-auto space-y-4 ${className}`}>
        <Card variant="learning" className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="indigo" size="sm">
              {data.subject}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>~{data.estimatedMinutes} min</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-sans font-bold text-white tracking-tight">
              {data.conceptName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {data.hook}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
            <span className="text-[11px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
              Learning Objective
            </span>
            <p className="text-xs text-slate-200 font-sans">{data.objective}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono">
            <span className="text-slate-400">Difficulty: {data.difficulty}</span>
            <span className="text-amber-400 font-bold">+{data.xpReward} XP upon completion</span>
          </div>
        </Card>

        {/* Contextual Buddy Greeting */}
        <BuddySpeech
          mood="speaking"
          speakerName="Buddy"
          message={`Welcome to ${data.conceptName}! I'll guide you through hands-on simulations to master how velocity and angles work together.`}
        />
      </div>
    );
  }

  // 2. EXPLAIN STAGE OVERLAY
  if (stage === 'explain') {
    return (
      <div className={`p-4 sm:p-6 max-w-xl mx-auto space-y-4 ${className}`}>
        <Card variant="default" className="p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
              Core Mechanism
            </span>
            <h3 className="text-lg font-sans font-bold text-white">
              {data.explanation.title}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            {data.explanation.summary}
          </p>

          <div className="p-3.5 rounded-xl bg-[#0A1024] border border-indigo-500/30 space-y-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
              Key Governing Principle
            </span>
            <p className="text-xs text-indigo-200 font-sans font-medium">
              {data.explanation.keyPrinciple}
            </p>
            {data.explanation.formula && (
              <div className="text-center py-1">
                <span className="font-mono text-base font-bold text-white tracking-wider">
                  {data.explanation.formula}
                </span>
              </div>
            )}
          </div>
        </Card>

        <BuddySpeech
          mood="speaking"
          speakerName="Buddy"
          message="Notice how horizontal velocity stays constant, while gravity pulls the vertical speed downward at 9.8 m/s²!"
        />
      </div>
    );
  }

  // 3. EXPLORE STAGE OVERLAY (Minimal, canvas takes focus)
  if (stage === 'explore') {
    return (
      <div className={`p-4 max-w-md mx-auto space-y-3 ${className}`}>
        <BuddySpeech
          mood="encouraging"
          speakerName="Buddy"
          message="Great! Try dragging the angle slider below to see how the trajectory arc curves through the air."
        />
      </div>
    );
  }

  // 4. PREDICT STAGE OVERLAY
  if (stage === 'predict') {
    return (
      <div className={`p-4 sm:p-6 max-w-xl mx-auto space-y-4 ${className}`}>
        <Card variant="highlight" className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
            <HelpCircle className="w-4 h-4" />
            <span>Hypothesis Check</span>
          </div>

          <h3 className="text-sm sm:text-base font-sans font-bold text-white leading-snug">
            {data.prediction.question}
          </h3>

          <div className="space-y-2">
            {data.prediction.options.map((opt) => {
              const isSelected = selectedPrediction === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPrediction(opt.id)}
                  className={`w-full p-3 rounded-xl text-left border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.3)]'
                      : 'bg-[#0E152E]/90 border-white/[0.08] hover:border-white/[0.18]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500 text-white font-bold'
                        : 'border-white/[0.2] text-slate-400'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                  <div>
                    <span className="font-mono font-bold text-sm text-white">{opt.label}</span>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <BuddySpeech
          mood="thinking"
          speakerName="Buddy"
          message="Lock in your prediction! We will fire the cannon right after to test your hypothesis."
        />
      </div>
    );
  }

  // 5. INTERACT STAGE OVERLAY
  if (stage === 'interact') {
    return (
      <div className={`p-4 max-w-md mx-auto space-y-3 ${className}`}>
        <BuddySpeech
          mood="speaking"
          speakerName="Buddy"
          message={`Ready! We're set at launch angle ${angle}° and initial velocity ${velocity} m/s. Tap 'Fire Cannon' in the bottom footer!`}
        />
      </div>
    );
  }

  // 6. OBSERVE STAGE OVERLAY
  if (stage === 'observe') {
    const isTargetHit = Math.abs(angle - 45) <= 5;
    return (
      <div className={`p-4 sm:p-6 max-w-lg mx-auto space-y-4 ${className}`}>
        <Card variant="elevated" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase">
              Flight Telemetry Breakdown
            </span>
            <Badge variant={isTargetHit ? 'success' : 'warning'} size="sm">
              {isTargetHit ? 'Target Reached' : 'Off-Target Delta'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <span className="text-slate-400">Launch Angle:</span>
              <p className="text-sm font-bold text-white">{angle}°</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <span className="text-slate-400">Initial Velocity:</span>
              <p className="text-sm font-bold text-white">{velocity} m/s</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">
            {isTargetHit
              ? 'Bullseye! The parabolic trajectory landed precisely within the 1.5m tolerance zone of the target.'
              : `At ${angle}°, the horizontal distance reached was off-center. An optimal 45° angle maximizes ground coverage.`}
          </p>
        </Card>

        <BuddySpeech
          mood={isTargetHit ? 'celebrating' : 'encouraging'}
          speakerName="Buddy"
          message={
            isTargetHit
              ? 'Incredible shot! Notice how the 45° trajectory maintained an ideal ratio of vertical hang-time to forward velocity.'
              : 'Good attempt! Observe where the projectile landed relative to the target flag.'
          }
        />
      </div>
    );
  }

  // 7. QUICK CHECK STAGE OVERLAY
  if (stage === 'quick_check') {
    const check = data.quickCheck;
    return (
      <div className={`p-4 sm:p-6 max-w-xl mx-auto space-y-4 ${className}`}>
        <Card variant="default" className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Formative Quick Check</span>
          </div>

          <h3 className="text-sm sm:text-base font-sans font-bold text-white leading-snug">
            {check.question}
          </h3>

          <div className="space-y-2">
            {check.options.map((optText, idx) => {
              const isSelected = selectedCheckOption === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedCheckOption(idx);
                    setIsCheckSubmitted(true);
                  }}
                  className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? idx === check.correctIndex
                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-medium'
                        : 'bg-rose-500/20 border-rose-500 text-white'
                      : 'bg-[#0E152E]/90 border-white/[0.08] hover:border-white/[0.18] text-slate-200'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-sans">{optText}</span>
                  {isSelected && (
                    <span className="font-mono text-xs font-bold">
                      {idx === check.correctIndex ? '✓ Correct' : '✗ Try Again'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isCheckSubmitted && (
            <FeedbackBanner
              type={selectedCheckOption === check.correctIndex ? 'correct' : 'hint'}
              message={check.explanation}
            />
          )}
        </Card>
      </div>
    );
  }

  // 8. MISSION STAGE OVERLAY (Quest)
  if (stage === 'mission') {
    return (
      <div className={`p-4 sm:p-6 max-w-xl mx-auto space-y-4 ${className}`}>
        <Card variant="mission" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
              <Target className="w-4 h-4" />
              <span>Active Mission</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
              +{data.mission.xpBonus} XP Bonus
            </span>
          </div>

          <div>
            <h3 className="text-lg font-sans font-bold text-white">{data.mission.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">{data.mission.description}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#0A1024] border border-amber-500/20 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Target Distance:</span>
            <span className="font-bold text-white">{data.mission.target}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <span className="text-slate-400">Attempts Remaining:</span>
            <span className="text-amber-400 font-bold">
              {data.mission.maxAttempts - missionAttempts + 1} / {data.mission.maxAttempts}
            </span>
          </div>
        </Card>

        <BuddySpeech
          mood="speaking"
          speakerName="Buddy"
          message="Align your angle carefully to 45° and adjust velocity to strike the 45m bullseye flag!"
        />
      </div>
    );
  }

  // 9. CHALLENGE STAGE OVERLAY
  if (stage === 'challenge') {
    return (
      <div className={`p-4 sm:p-6 max-w-xl mx-auto space-y-4 ${className}`}>
        <Card variant="reward" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase">
              <Trophy className="w-4 h-4" />
              <span>Advanced Challenge</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
              +{data.challenge.xpBonus} XP
            </span>
          </div>

          <div>
            <h3 className="text-lg font-sans font-bold text-white">{data.challenge.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">{data.challenge.description}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#0A1024] border border-amber-400/30 text-xs font-mono text-amber-200">
            ⚠️ <strong>Constraint:</strong> {data.challenge.constraint}
          </div>
        </Card>

        <BuddySpeech
          mood="observing"
          speakerName="Buddy"
          message="With velocity locked, changing only your launch angle changes both height and distance simultaneously!"
        />
      </div>
    );
  }

  // 10. ASSESSMENT STAGE OVERLAY
  if (stage === 'assessment') {
    const q = data.assessment.questions[0];
    return (
      <div className={`p-4 sm:p-6 max-w-xl mx-auto space-y-4 ${className}`}>
        <Card variant="default" className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase">
            <Award className="w-4 h-4" />
            <span>Evaluative Transfer Check</span>
          </div>

          <h3 className="text-sm sm:text-base font-sans font-bold text-white leading-snug">
            {q.prompt}
          </h3>

          <div className="space-y-2">
            {q.options.map((optText, idx) => {
              const isSelected = selectedAssessmentOption === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedAssessmentOption(idx);
                    setIsAssessmentSubmitted(true);
                  }}
                  className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? idx === q.correctIndex
                        ? 'bg-purple-500/20 border-purple-500 text-white'
                        : 'bg-rose-500/20 border-rose-500 text-white'
                      : 'bg-[#0E152E]/90 border-white/[0.08] hover:border-white/[0.18] text-slate-200'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-sans">{optText}</span>
                  {isSelected && (
                    <span className="font-mono text-xs font-bold">
                      {idx === q.correctIndex ? '✓ Validated' : '✗ Incorrect'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isAssessmentSubmitted && (
            <FeedbackBanner
              type={selectedAssessmentOption === q.correctIndex ? 'mastered' : 'hint'}
              message={q.explanation}
            />
          )}
        </Card>
      </div>
    );
  }

  // 11. FEEDBACK STAGE OVERLAY
  if (stage === 'feedback') {
    return (
      <div className={`p-4 sm:p-6 max-w-xl mx-auto space-y-4 ${className}`}>
        <Card variant="elevated" className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="text-lg font-sans font-bold text-white">Class Mastery Synthesis</h3>
            <Badge variant="mastered" size="sm">
              85% Accuracy
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Demonstrated Evidence:</span>
              <span className="text-emerald-400 font-bold">High (4/5 Concepts Verified)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Completion Time:</span>
              <span className="text-white font-bold">6m 12s</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Total XP Earned:</span>
              <span className="text-amber-400 font-bold">+{data.xpReward + 80} XP</span>
            </div>
          </div>

          {/* Xira Cognitive Observation */}
          <XiraCard
            type="feedback"
            title="What Xira Observed"
            message="You showed rapid intuition identifying the 45° maximum trajectory angle. Your understanding of complementary launch angles was confirmed in the evaluative check."
          />
        </Card>
      </div>
    );
  }

  // 12. REWARD STAGE OVERLAY
  if (stage === 'reward') {
    return (
      <div className={`p-4 sm:p-6 max-w-md mx-auto space-y-4 text-center ${className}`}>
        <Card variant="reward" className="p-6 space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
            🏆
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-sans font-bold text-white">Well Done!</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              You completed Class {data.classNumber} of {data.totalClasses}: {data.conceptName}.
            </p>
          </div>

          <div className="w-full p-4 rounded-xl bg-[#0A1024]/80 border border-amber-400/30 grid grid-cols-2 gap-2 text-center">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">XP Awarded</span>
              <p className="font-mono text-lg font-bold text-amber-300">
                +{data.xpReward + 80} XP
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Day Streak</span>
              <p className="font-mono text-lg font-bold text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" /> 5 Days
              </p>
            </div>
          </div>
        </Card>

        <BuddySpeech
          mood="celebrating"
          speakerName="Buddy"
          message="Outstanding work! Your mastery score increased, and you're ready for the next adventure."
        />
      </div>
    );
  }

  // 13. NEXT CLASS STAGE OVERLAY
  if (stage === 'next_class') {
    return (
      <div className={`p-4 sm:p-6 max-w-lg mx-auto space-y-4 ${className}`}>
        <Card variant="learning" className="p-5 sm:p-6 space-y-4">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
            Deterministic Curriculum Recommendation
          </span>

          <div>
            <span className="text-xs text-slate-400 font-sans">Next Up:</span>
            <h3 className="text-xl font-sans font-bold text-white tracking-tight">
              {data.nextConcept.conceptName}
            </h3>
            <p className="text-xs text-indigo-300 font-mono mt-0.5">{data.nextConcept.subject}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
              Why this class next?
            </span>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              {data.nextConcept.reason}
            </p>
          </div>
        </Card>

        <BuddySpeech
          mood="speaking"
          speakerName="Buddy"
          message={`Let's keep the momentum going! Tap 'Start Next Class' to begin ${data.nextConcept.conceptName}.`}
        />
      </div>
    );
  }

  return null;
};

export default ClassStageOverlay;
