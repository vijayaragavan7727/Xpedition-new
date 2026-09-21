'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, Sparkles, RefreshCw, Zap } from 'lucide-react';

export interface XiraActionItem {
  id: string;
  label: string;
  icon?: 'class' | 'practice' | 'quiz' | 'harder' | 'explain';
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

export interface XiraActionBarProps {
  conceptId?: string;
  conceptName?: string;
  actions?: XiraActionItem[];
  onTriggerAction?: (actionType: 'harder' | 'explain' | 'quiz' | 'practice') => void;
  className?: string;
}

export const XiraActionBar: React.FC<XiraActionBarProps> = ({
  conceptId = 'projectile_motion',
  conceptName,
  actions,
  onTriggerAction,
  className = '',
}) => {
  const encodedConcept = encodeURIComponent(conceptId);

  // Default action set if custom actions are not provided
  const defaultActions: XiraActionItem[] = [
    {
      id: 'start-class',
      label: 'Try in Class',
      icon: 'class',
      href: `/class/${encodedConcept}`,
      primary: true,
    },
    {
      id: 'practice-this',
      label: 'Practice this',
      icon: 'practice',
      href: `/quest?concept=${encodedConcept}`,
    },
    {
      id: 'quiz-me',
      label: 'Quiz me',
      icon: 'quiz',
      onClick: () => onTriggerAction?.('quiz'),
    },
    {
      id: 'explain-differently',
      label: 'Explain differently',
      icon: 'explain',
      onClick: () => onTriggerAction?.('explain'),
    },
  ];

  const renderedActions = actions || defaultActions;

  const renderIcon = (icon?: string) => {
    switch (icon) {
      case 'class':
        return <Zap className="w-3.5 h-3.5" />;
      case 'practice':
        return <Brain className="w-3.5 h-3.5" />;
      case 'quiz':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'harder':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'explain':
        return <RefreshCw className="w-3.5 h-3.5" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      role="group"
      aria-label="Suggested Learning Actions"
      className={`flex flex-wrap items-center gap-2 pt-1 ${className}`}
    >
      {renderedActions.map((action) => {
        const baseClasses = `min-h-[40px] px-3.5 py-1.5 rounded-xl font-sans text-xs font-semibold inline-flex items-center gap-2 transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 select-none`;
        const variantClasses = action.primary
          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-450 hover:to-indigo-550 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/30'
          : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] hover:border-white/[0.16]';

        if (action.href) {
          return (
            <Link
              key={action.id}
              href={action.href}
              className={`${baseClasses} ${variantClasses}`}
              id={`xira-action-${action.id}`}
            >
              {renderIcon(action.icon)}
              <span>{action.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={`${baseClasses} ${variantClasses}`}
            id={`xira-action-${action.id}`}
          >
            {renderIcon(action.icon)}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default XiraActionBar;
