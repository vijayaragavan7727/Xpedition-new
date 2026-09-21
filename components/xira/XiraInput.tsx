'use client';

import React, { useRef } from 'react';
import { Send, Paperclip, Loader2, Sparkles, Brain, BookOpen, Lightbulb } from 'lucide-react';

export type StudyMode = 'EXPLAIN' | 'PRACTICE' | 'QUIZ' | 'HINT';

export interface XiraInputProps {
  query: string;
  onChangeQuery: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  activeMode: StudyMode;
  onSelectMode: (mode: StudyMode) => void;
  onAttachFile: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const STUDY_MODES: Array<{ mode: StudyMode; label: string; icon: React.ReactNode }> = [
  { mode: 'EXPLAIN', label: 'Explain', icon: <Sparkles className="w-3 h-3" /> },
  { mode: 'PRACTICE', label: 'Practice', icon: <Brain className="w-3 h-3" /> },
  { mode: 'QUIZ', label: 'Quiz me', icon: <BookOpen className="w-3 h-3" /> },
  { mode: 'HINT', label: 'Hint', icon: <Lightbulb className="w-3 h-3" /> },
];

export const XiraInput: React.FC<XiraInputProps> = ({
  query,
  onChangeQuery,
  onSubmit,
  isLoading,
  activeMode,
  onSelectMode,
  onAttachFile,
  disabled = false,
  placeholder = 'Ask Xira anything about this concept...',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && query.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAttachFile(files[0]);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Mode Selector Chips */}
      <div
        role="tablist"
        aria-label="Study Modes"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
      >
        {STUDY_MODES.map((m) => {
          const isSelected = activeMode === m.mode;
          return (
            <button
              key={m.mode}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectMode(m.mode)}
              disabled={disabled || isLoading}
              className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 select-none ${
                isSelected
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-[#0F1426] border border-white/[0.1] focus-within:border-indigo-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all">
        <textarea
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={2}
          aria-label="Ask Xira study question"
          className="w-full bg-transparent px-4 pt-3 pb-12 text-sm text-white placeholder-slate-500 focus:outline-none resize-none font-sans"
        />

        {/* Bottom Actions Row */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {/* File Attachment Button */}
          <div className="pointer-events-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
              id="xira-material-upload"
              aria-label="Attach study material"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
              title="Attach learning material (PDF, TXT, DOCX, PNG, JPG)"
              className="min-h-[36px] min-w-[36px] px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-indigo-300 border border-white/[0.06] flex items-center gap-1.5 text-xs transition-all focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none active:scale-[0.98]"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add material</span>
            </button>
          </div>

          {/* Submit Button */}
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || isLoading || !query.trim()}
              aria-label="Send query to Xira"
              className="min-h-[36px] min-w-[36px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-450 hover:to-indigo-550 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask Xira</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XiraInput;
