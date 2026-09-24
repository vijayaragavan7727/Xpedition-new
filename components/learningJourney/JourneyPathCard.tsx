'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { JourneyNode, LearningJourneyData } from '@/lib/learningJourney/learningJourneyModel';
import {
  Check,
  Lock,
  ArrowRight,
  Clock,
  BarChart2,
  Atom,
  Sparkles,
  Mountain,
  Info,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';

interface JourneyPathCardProps {
  data: LearningJourneyData;
}

export const JourneyPathCard: React.FC<JourneyPathCardProps> = ({ data }) => {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const handleNodeClick = (node: JourneyNode) => {
    if (node.status === 'locked') {
      setLockedNotice(`"${node.title}" is locked. Complete the previous concept first.`);
      setTimeout(() => setLockedNotice(null), 3500);
      return;
    }
    setSelectedNode(node);
  };

  const handleContinueLesson = (conceptId: string) => {
    router.push(`/class?concept=${conceptId}`);
  };

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white/95 border border-[#EBE7DF] p-3.5 sm:p-5 md:p-7 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] relative select-none">
      {/* 1. Subject & Pathway Header Bar (2-Row Compact on Mobile, Spacious on Desktop) */}
      <div className="pb-3 sm:pb-5 border-b border-[#F0ECE1] space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Top Row on mobile: Subject Info (Left) + Level Badge (Right) */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-[#0F5132] text-white flex items-center justify-center shadow-md shadow-[#0F5132]/20 shrink-0">
              <Atom className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-serif font-black text-base sm:text-lg md:text-xl text-slate-900 tracking-tight leading-none">
                {data.subject.title}
              </h2>
              <p className="font-sans text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5 sm:mt-1">
                {data.subject.topic}
              </p>
            </div>
          </div>

          {/* Level Badge on mobile sits on right of top row */}
          <div className="inline-flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F5EE] border border-[#C5E6D2] text-[#0F5132] text-[11px] font-sans font-bold shadow-xs">
            <Mountain className="w-3 h-3 text-[#0F5132]" />
            <span>Level {data.subject.level}</span>
          </div>
        </div>

        {/* Bottom Row on mobile: Progress bar + Level Capsule on desktop */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-1 sm:pt-0">
          <div className="space-y-1 w-full sm:w-auto sm:min-w-[150px]">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-sans font-semibold text-slate-700">
              <span>{data.subject.completedCount + 1} of {data.subject.totalCount} lessons</span>
              <span className="font-mono text-slate-500">{data.subject.progressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 sm:h-2 rounded-full bg-[#EAE6DB] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0F5132] transition-all duration-500"
                style={{ width: `${data.subject.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Level capsule on desktop */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8F5EE] border border-[#C5E6D2] text-[#0F5132] text-xs font-sans font-bold shadow-xs shrink-0">
            <Mountain className="w-4 h-4 text-[#0F5132]" />
            <span>Level {data.subject.level} • {data.subject.levelTitle}</span>
          </div>
        </div>
      </div>

      {/* Locked Concept Floating Banner Notice */}
      {lockedNotice && (
        <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-30 bg-[#2D3748] text-white text-xs font-sans font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fadeIn border border-white/10 max-w-[90%]">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{lockedNotice}</span>
          <button
            type="button"
            onClick={() => setLockedNotice(null)}
            className="ml-1 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. Main Body Grid: Winding Map (Left) + Current Lesson Action Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 pt-3.5 sm:pt-6 items-stretch">
        {/* Left Side: Illustrated Winding Journey Trail (Compact 360-400px on mobile) */}
        <div className="lg:col-span-7 xl:col-span-8 relative h-[360px] sm:h-[400px] md:min-h-[440px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#EBF4EE] via-[#FAF9F5] to-[#F3EDE2] border border-[#EBE7DF] p-2.5 sm:p-4 md:p-5 flex flex-col justify-between">
          {/* Subtle soft illustrated landscape terrain background */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <Image
              src="/images/learning-journey/learning-journey-bg.jpg"
              alt=""
              fill
              className="object-cover object-bottom"
            />
          </div>

          {/* SVG Trail Curve Vector connecting nodes in 2D landscape */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 500 400"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="trailRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2EDE6" />
                <stop offset="50%" stopColor="#DFEAE2" />
                <stop offset="100%" stopColor="#E7E3D8" />
              </linearGradient>
            </defs>

            {/* Soft Shadow & Ground Trail Bed */}
            <path
              d="M 70,72 C 120,60 160,60 210,64 C 255,70 230,130 260,176 C 290,215 360,165 400,192 C 430,220 410,265 380,304 C 340,335 300,335 250,328 C 200,320 165,330 130,312 C 90,290 60,260 70,224"
              stroke="url(#trailRibbon)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Main Green Journey Path */}
            <path
              d="M 70,72 C 120,60 160,60 210,64 C 255,70 230,130 260,176 C 290,215 360,165 400,192 C 430,220 410,265 380,304 C 340,335 300,335 250,328 C 200,320 165,330 130,312 C 90,290 60,260 70,224"
              stroke="#0F5132"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 6"
            />

            {/* Destination Flag at Final Node 8 */}
            <g transform="translate(62, 206)">
              <line x1="0" y1="18" x2="0" y2="0" stroke="#B48332" strokeWidth="2" strokeLinecap="round" />
              <polygon points="0,0 12,4 0,8" fill="#D4AF37" />
            </g>
          </svg>

          {/* 8 Nodes Positioned on the Trail */}
          <div className="relative w-full h-full min-h-[320px] sm:min-h-[360px] md:min-h-[400px]">
            {data.nodes.map((node) => {
              const isCompleted = node.status === 'completed';
              const isCurrent = node.status === 'current';
              const isLocked = node.status === 'locked';

              return (
                <div
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Concept ${node.stepNumber}: ${node.title} - ${node.status}`}
                  onClick={() => handleNodeClick(node)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNodeClick(node);
                    }
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] focus-visible:ring-offset-2 rounded-full"
                  style={{ left: `${node.coords.x}%`, top: `${node.coords.y}%` }}
                >
                  {/* Node Badge Avatar */}
                  <div className="relative flex flex-col items-center">
                    {/* Current Node Beacon Flag & Pedestal */}
                    {isCurrent && (
                      <div className="absolute -top-9 sm:-top-11 flex flex-col items-center animate-bounce duration-[2000ms] pointer-events-none z-20">
                        <div className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#0F5132] text-white text-[9px] sm:text-[10px] font-sans font-bold shadow-md whitespace-nowrap flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                          <span>Current Lesson</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#0F5132] rotate-45 -mt-0.5" />
                      </div>
                    )}

                    {/* Node Circle */}
                    <div
                      className={`relative w-8 sm:w-10 md:w-11 h-8 sm:h-10 md:h-11 rounded-full flex items-center justify-center font-sans font-bold text-xs sm:text-sm shadow-md transition-all ${
                        isCompleted
                          ? 'bg-[#0F5132] text-white ring-3 sm:ring-4 ring-[#E8F5EE] group-hover:ring-[#C5E6D2]'
                          : isCurrent
                          ? 'bg-[#0F5132] text-white ring-3 sm:ring-4 ring-[#0F5132]/30 ring-offset-1 sm:ring-offset-2 animate-pulse'
                          : 'bg-[#FAF8F5] text-slate-400 border-2 border-slate-300 group-hover:border-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      ) : isCurrent ? (
                        <span>{node.stepNumber}</span>
                      ) : (
                        <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                      )}
                    </div>

                    {/* Node Text Label Card */}
                    <div className="mt-1 text-center pointer-events-none max-w-[76px] sm:max-w-[95px] md:max-w-[120px]">
                      <p
                        className={`text-[10px] sm:text-xs font-sans font-bold leading-tight ${
                          isCurrent
                            ? 'text-[#0F5132]'
                            : isCompleted
                            ? 'text-slate-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {node.title}
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-sans text-slate-400 mt-0.5 font-medium hidden xs:block sm:block">
                        {node.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wooden signpost watermark at bottom-left */}
          <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 pt-1 sm:pt-2 text-[10px] sm:text-[11px] font-sans font-semibold text-[#0F5132]">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
            <span>Trail to Mastery: Follow the winding checkpoints</span>
          </div>
        </div>

        {/* Right Side: Current Lesson Destination Card (Compact on mobile) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF] p-3.5 sm:p-5 md:p-6 shadow-xs">
          <div className="space-y-3 sm:space-y-4">
            {/* Destination Illustration Pedestal */}
            <div className="relative w-full h-28 sm:h-36 md:h-42 rounded-xl overflow-hidden bg-gradient-to-br from-[#E8F5EE] via-[#FAF9F5] to-[#E5EFE8] border border-[#D5E6DC] flex items-center justify-center p-2.5 sm:p-3 shadow-inner">
              {/* Radial warm lighting glow behind motor model */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(232, 245, 238, 0.95) 0%, rgba(247, 244, 233, 0.4) 65%, transparent 100%)',
                }}
              />
              <Image
                src={data.currentLesson.imageSrc}
                alt={data.currentLesson.title}
                width={150}
                height={110}
                className="object-contain drop-shadow-md sm:drop-shadow-lg transition-transform duration-300 hover:scale-105 relative z-10 max-h-24 sm:max-h-32"
              />
              <div className="absolute top-2 left-2 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#0F5132] text-white font-mono text-[9px] sm:text-[10px] font-bold shadow-xs z-10">
                Next Destination
              </div>
            </div>

            {/* Lesson Title & Metas */}
            <div className="space-y-1 sm:space-y-1.5">
              <h3 className="font-serif font-black text-base sm:text-lg md:text-xl text-slate-900 tracking-tight leading-snug">
                {data.currentLesson.title}
              </h3>

              <div className="flex items-center gap-2.5 text-[11px] sm:text-xs font-sans text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-[#0F5132]" />
                  {data.currentLesson.estimatedMinutes} min
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                  <BarChart2 className="w-3.5 h-3.5 text-[#0F5132]" />
                  {data.currentLesson.conceptNumberLabel}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
              {data.currentLesson.description}
            </p>
          </div>

          {/* Primary CTA: "Continue Learning →" */}
          <div className="pt-3 sm:pt-5 mt-auto">
            <button
              type="button"
              onClick={() => handleContinueLesson(data.currentLesson.conceptId)}
              className="w-full h-11 sm:h-12 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white font-sans font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-[#0F5132]/25 transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] focus-visible:ring-offset-2"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Node Concept Detail Modal Dialog (when completed or current node is clicked) */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#EBE7DF] p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedNode.status === 'completed'
                      ? 'bg-[#0F5132] text-white'
                      : 'bg-[#E8F5EE] text-[#0F5132]'
                  }`}
                >
                  {selectedNode.status === 'completed' ? <Check className="w-4 h-4" /> : selectedNode.stepNumber}
                </div>
                <h4 className="font-sans font-bold text-base text-slate-900">{selectedNode.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed">
              {selectedNode.description}
            </p>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE7DF] flex items-center justify-between text-xs font-sans text-slate-500">
              <span>Status: <strong className="text-slate-800 capitalize">{selectedNode.status}</strong></span>
              <span>Estimated: ~{selectedNode.estimatedMinutes} min</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-xl text-xs font-sans font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedNode(null);
                  handleContinueLesson(selectedNode.conceptId);
                }}
                className="px-4 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-sans font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span>{selectedNode.status === 'completed' ? 'Review Concept' : 'Enter Class'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyPathCard;
