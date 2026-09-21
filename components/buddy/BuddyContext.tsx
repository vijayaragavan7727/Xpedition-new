'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { BuddyState, getBuddyStateForClassStage } from './BuddyState';

export interface BuddyContextValue {
  buddyState: BuddyState;
  message: string | null;
  isVisible: boolean;
  setBuddyState: (state: BuddyState) => void;
  setBuddyMessage: (msg: string | null) => void;
  setIsVisible: (visible: boolean) => void;
  triggerReaction: (reaction: 'correct' | 'incorrect' | 'celebrate' | 'hint' | 'think') => void;
  syncWithClassStage: (stageId: string, customMessage?: string) => void;
}

const BuddyContext = createContext<BuddyContextValue | undefined>(undefined);

export interface BuddyProviderProps {
  children: React.ReactNode;
  initialState?: BuddyState;
  initialMessage?: string | null;
}

export const BuddyProvider: React.FC<BuddyProviderProps> = ({
  children,
  initialState = 'IDLE',
  initialMessage = null,
}) => {
  const [buddyState, setBuddyState] = useState<BuddyState>(initialState);
  const [message, setBuddyMessage] = useState<string | null>(initialMessage);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const triggerReaction = useCallback(
    (reaction: 'correct' | 'incorrect' | 'celebrate' | 'hint' | 'think') => {
      switch (reaction) {
        case 'correct':
          setBuddyState('CORRECT');
          setTimeout(() => setBuddyState('IDLE'), 2400);
          break;
        case 'incorrect':
          setBuddyState('INCORRECT');
          setTimeout(() => setBuddyState('IDLE'), 2800);
          break;
        case 'celebrate':
          setBuddyState('CELEBRATING');
          setTimeout(() => setBuddyState('COMPLETE'), 3200);
          break;
        case 'hint':
          setBuddyState('HINTING');
          break;
        case 'think':
          setBuddyState('THINKING');
          break;
      }
    },
    []
  );

  const syncWithClassStage = useCallback(
    (stageId: string, customMessage?: string) => {
      const nextState = getBuddyStateForClassStage(stageId);
      setBuddyState(nextState);

      // CRITICAL ASSESSMENT SILENCE: During assessment, Buddy does not bias or display answers
      if (stageId === 'assessment') {
        setBuddyMessage(null);
        return;
      }

      if (customMessage !== undefined) {
        setBuddyMessage(customMessage);
      }
    },
    []
  );

  return (
    <BuddyContext.Provider
      value={{
        buddyState,
        message,
        isVisible,
        setBuddyState,
        setBuddyMessage,
        setIsVisible,
        triggerReaction,
        syncWithClassStage,
      }}
    >
      {children}
    </BuddyContext.Provider>
  );
};

export function useBuddy(): BuddyContextValue {
  const context = useContext(BuddyContext);
  if (!context) {
    throw new Error('useBuddy must be used within a BuddyProvider');
  }
  return context;
}
