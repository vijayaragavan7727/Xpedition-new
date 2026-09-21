'use client';

import React, { useState } from 'react';
import { Drawer, Button, CircularProgress } from '@/components/ui';
import { Calculator, BookOpen, Bot, BarChart2, Send, Check } from 'lucide-react';

export type ClassToolType = 'formula' | 'notes' | 'xira' | 'progress';

export interface ClassToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  toolType: ClassToolType;
  conceptName: string;
  formula?: string;
  formulaDescription?: string;
  classProgressPercent?: number;
  classNumber?: number;
  totalClasses?: number;
}

export const ClassToolsDrawer: React.FC<ClassToolsDrawerProps> = ({
  isOpen,
  onClose,
  toolType,
  conceptName,
  formula = 'R = (v² · sin 2θ) / g',
  formulaDescription = 'Where v is velocity, θ is launch angle, and g is gravitational acceleration (9.8 m/s²).',
  classProgressPercent = 72,
  classNumber = 3,
  totalClasses = 7,
}) => {
  // Local state for personal notes
  const [noteText, setNoteText] = useState(
    'Remember:\n• 45° gives maximum horizontal range.\n• Higher angle = more height, but slower forward progress.\n• Gravity always pulls vertically downwards at 9.8 m/s².'
  );
  const [isSaved, setIsSaved] = useState(false);

  // Local state for Ask Xira input
  const [xiraInput, setXiraInput] = useState('');
  const [xiraResponse, setXiraResponse] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const handleSaveNotes = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAskXira = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!xiraInput.trim()) return;

    setIsAsking(true);
    setTimeout(() => {
      setIsAsking(false);
      setXiraResponse(
        `Regarding ${conceptName}: In this experiment, notice that launch angle affects both hang-time and horizontal distance. Angle 45° yields the theoretical maximum because sin(2θ) reaches its crest of 1.0.`
      );
      setXiraInput('');
    }, 600);
  };

  const titles: Record<ClassToolType, { title: string; subtitle: string; icon: React.ReactNode }> = {
    formula: {
      title: 'Formula Sheet',
      subtitle: `${conceptName} • Reference Guide`,
      icon: <Calculator className="w-4 h-4 text-indigo-400" />,
    },
    notes: {
      title: 'Study Notes',
      subtitle: `${conceptName} • Personal Scratchpad`,
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
    },
    xira: {
      title: 'Ask Xira',
      subtitle: `Contextual AI Brain • ${conceptName}`,
      icon: <Bot className="w-4 h-4 text-sky-400" />,
    },
    progress: {
      title: 'Session Progress',
      subtitle: `Class ${classNumber} of ${totalClasses}`,
      icon: <BarChart2 className="w-4 h-4 text-emerald-400" />,
    },
  };

  const activeMeta = titles[toolType] || titles.formula;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={activeMeta.title}
      subtitle={activeMeta.subtitle}
      icon={activeMeta.icon}
      position="bottom"
    >
      {/* 1. Formula Sheet */}
      {toolType === 'formula' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
            <span className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Fundamental Equation
            </span>
            <div className="p-3 rounded-xl bg-[#0A1024] border border-indigo-500/30 text-center">
              <span className="font-mono text-xl font-bold text-white tracking-wider">
                {formula}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1 font-sans">
              {formulaDescription}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
            💡 <strong>Pro Tip:</strong> Try complementary angles like 30° and 60° to confirm they produce equal distance!
          </div>

          <Button variant="secondary" size="md" onClick={onClose} className="w-full">
            Back to Class
          </Button>
        </div>
      )}

      {/* 2. Study Notes */}
      {toolType === 'notes' && (
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={6}
            aria-label="Personal study notes"
            placeholder="Write observations, questions, or key takeaways..."
            className="w-full p-3.5 rounded-xl bg-[#0A1024]/90 text-sm font-sans text-white border border-white/[0.08] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Auto-saved to your profile</span>
            <Button
              variant={isSaved ? 'success' : 'primary'}
              size="sm"
              onClick={handleSaveNotes}
              leftIcon={isSaved ? <Check className="w-3.5 h-3.5" /> : undefined}
            >
              {isSaved ? 'Saved' : 'Save Notes'}
            </Button>
          </div>
        </div>
      )}

      {/* 3. Ask Xira */}
      {toolType === 'xira' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
            🤖 <strong>Xira Brain:</strong> I know your current class context, your active simulation angle, and your recent predictions. Ask me anything!
          </div>

          {xiraResponse && (
            <div className="p-4 rounded-xl bg-white/[0.04] border border-sky-500/30 space-y-1">
              <span className="text-[11px] font-mono font-bold text-sky-400 uppercase">
                Xira Explanation:
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{xiraResponse}</p>
            </div>
          )}

          <form onSubmit={handleAskXira} className="flex gap-2">
            <input
              type="text"
              value={xiraInput}
              onChange={(e) => setXiraInput(e.target.value)}
              placeholder="e.g. Why does 45 degrees give maximum range?"
              className="flex-1 h-11 px-3.5 rounded-xl bg-[#0A1024] text-xs sm:text-sm text-white border border-white/[0.08] focus:border-indigo-500 focus:outline-none"
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isAsking}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </form>

          {/* Quick chip queries */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['Explain formula', 'What is optimal angle?', 'How does gravity act?'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setXiraInput(chip);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Progress Tracker */}
      {toolType === 'progress' && (
        <div className="space-y-5 flex flex-col items-center text-center">
          <CircularProgress
            value={classProgressPercent}
            size={96}
            variant="indigo"
            label="Class Mastery"
            sublabel="Evidence Verified"
          />

          <div className="w-full grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-left">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                Class Progress
              </span>
              <p className="text-sm font-mono font-bold text-white">
                {classNumber} of {totalClasses} Completed
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-left">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                Estimated Time
              </span>
              <p className="text-sm font-mono font-bold text-emerald-400">~6 minutes</p>
            </div>
          </div>

          <Button variant="secondary" size="md" onClick={onClose} className="w-full">
            Resume Class
          </Button>
        </div>
      )}
    </Drawer>
  );
};

export default ClassToolsDrawer;
