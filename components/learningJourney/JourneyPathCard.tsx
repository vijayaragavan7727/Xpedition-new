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
  onExploreTopics?: () => void;
}

export const JourneyPathCard: React.FC<JourneyPathCardProps> = ({ data, onExploreTopics }) => {
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
    <div className="w-full space-y-1.5 sm:space-y-5 select-none">
      {/* 1. Subject & Pathway Header Card (Section C in reference) */}
      <div className="w-full rounded-xl sm:rounded-3xl bg-white/95 border border-[#EBE7DF] p-2 xs:p-2.5 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Physics Icon + Subject Title & Topic */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-2xl bg-[#0F5132] text-white flex items-center justify-center shadow-xs sm:shadow-md sm:shadow-[#0F5132]/20 shrink-0">
              <Atom className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-serif font-black text-xs xs:text-sm sm:text-lg md:text-xl text-slate-900 tracking-tight leading-none">
                {data.subject.title}
              </h2>
              <p className="font-sans text-[9.5px] xs:text-[10.5px] sm:text-xs text-slate-500 font-semibold mt-0.5">
                {data.subject.topic}
              </p>
            </div>
          </div>

          {/* Right: Progress Bar + Level Badge */}
          <div className="flex flex-col items-end gap-1 min-w-[125px] xs:min-w-[145px] sm:min-w-[200px]">
            <div className="flex items-center justify-between w-full text-[9.5px] xs:text-[10.5px] sm:text-xs font-sans font-semibold text-slate-700">
              <span>{data.subject.completedCount + 1} of {data.subject.totalCount} lessons</span>
              <span className="font-mono text-slate-500">{data.subject.progressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 sm:h-2 rounded-full bg-[#EAE6DB] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0F5132] transition-all duration-500"
                style={{ width: `${data.subject.progressPercentage}%` }}
              />
            </div>
            {/* Level Pill + Explore CTA */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F5EE] border border-[#C5E6D2] text-[#0F5132] text-[9px] xs:text-[9.5px] sm:text-xs font-sans font-bold shadow-2xs">
                <Mountain className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#0F5132]" />
                <span>Level {data.subject.level} • {data.subject.levelTitle}</span>
              </div>
              {onExploreTopics && (
                <button
                  type="button"
                  onClick={onExploreTopics}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] hover:bg-[#EFECE4] border border-[#EBE7DF] text-slate-700 text-[9px] xs:text-[9.5px] sm:text-xs font-sans font-semibold cursor-pointer transition-colors"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  <span>Explore Topics</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Locked Concept Floating Banner Notice */}
      {lockedNotice && (
        <div className="absolute top-14 sm:top-20 left-1/2 transform -translate-x-1/2 z-30 bg-[#2D3748] text-white text-xs font-sans font-medium px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg flex items-center gap-2 animate-fadeIn border border-white/10 max-w-[90%]">
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

      {/* Visible Neural Network decision tree */}
      <div className="w-full rounded-xl sm:rounded-3xl bg-white border border-[#DDE7E0] p-4 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-[#0F5132]">Neural Network roadmap</p>
            <h3 className="font-serif font-black text-xl sm:text-2xl text-slate-900 mt-1">Learn it inch by inch</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              The full path stays visible. Each node unlocks after you understand the previous idea.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[#F3F8F4] border border-[#D7E9DC] px-3 py-2 text-xs font-semibold text-[#0F5132]">
            <span className="w-2 h-2 rounded-full bg-[#0F5132] animate-pulse" />
            {data.nodes.filter((n) => n.status === 'completed').length}/{data.nodes.length} mastered
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto py-2">
          <div className="absolute left-5 sm:left-7 top-7 bottom-7 w-px bg-[#C9DCCF]" aria-hidden="true" />
          <div className="space-y-2.5 sm:space-y-3">
            {data.nodes.map((node) => {
              const completed = node.status === 'completed';
              const current = node.status === 'current';
              const locked = node.status === 'locked';
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleNodeClick(node)}
                  className={`relative w-full flex items-center gap-3 sm:gap-4 text-left rounded-2xl border p-2.5 sm:p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${current ? 'bg-[#F0F8F2] border-[#7FB894] shadow-sm' : completed ? 'bg-white border-[#DDE7E0]' : 'bg-[#FAF8F5] border-[#E8E3D9] opacity-80'}`}
                >
                  <span className={`relative z-10 w-10 h-10 sm:w-14 sm:h-14 rounded-full shrink-0 flex items-center justify-center font-bold text-sm sm:text-base border-4 border-white ${completed || current ? 'bg-[#0F5132] text-white' : 'bg-[#E7E3D8] text-slate-500'}`}>
                    {completed ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : node.stepNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-black text-sm sm:text-base text-slate-900">{node.title}</span>
                      {current && <span className="px-2 py-0.5 rounded-full bg-[#0F5132] text-white text-[9px] font-bold uppercase tracking-wide">Now</span>}
                      {locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    </span>
                    <span className="block text-[11px] sm:text-xs text-slate-500 mt-0.5">{node.description}</span>
                  </span>
                  <span className="hidden sm:flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">{node.estimatedMinutes} min</span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1">{node.subtitle}</span>
                  </span>
                  {current && <ArrowRight className="w-4 h-4 text-[#0F5132] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current lesson */}
      <div className="w-full rounded-2xl bg-[#0D1712] text-white p-4 sm:p-6 border border-[#263C30] shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300">Current concept</p>
            <h3 className="font-serif font-black text-xl sm:text-2xl mt-1">{data.currentLesson.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">{data.currentLesson.description}</p>
          </div>
          <button
            type="button"
            onClick={() => handleContinueLesson(data.currentLesson.conceptId)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0F5132] font-bold text-sm hover:bg-emerald-50 transition-colors"
          >
            Continue lesson <ArrowRight className="w-4 h-4" />
          </button>
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
