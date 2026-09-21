'use client';

import React from 'react';
import { Sparkles, Compass, Lightbulb } from 'lucide-react';

export interface XiraSuggestionProps {
  activeConceptName?: string;
  onSelect: (suggestionText: string) => void;
  className?: string;
}

export const XiraSuggestion: React.FC<XiraSuggestionProps> = ({
  activeConceptName,
  onSelect,
  className = '',
}) => {
  const suggestions = activeConceptName && activeConceptName !== 'Core Topic'
    ? [
        `Explain ${activeConceptName} simply`,
        `What is the key idea behind ${activeConceptName}?`,
        `Give me a practice question for ${activeConceptName}`,
        `How does ${activeConceptName} apply in the real world?`,
      ]
    : [
        'What is projectile motion?',
        'How do enzymes work in biology?',
        'Explain recursion with a simple example',
        'Help me plan my study schedule',
      ];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
        <Lightbulb className="w-3 h-3 text-amber-400" />
        <span>Suggestions</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((text, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(text)}
            className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-indigo-500/30 text-slate-300 hover:text-white font-sans text-xs transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98]"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default XiraSuggestion;
