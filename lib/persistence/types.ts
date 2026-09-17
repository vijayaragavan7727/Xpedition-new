/**
 * Xpedition Production Persistence — Canonical Types & Contracts
 *
 * Defines the canonical data structures for persistent learner state,
 * user profiles, mastery tracking, attempts, progression, and Xira educational memory.
 */

import type { ConceptMastery, Attempt, SkillGraph, LearnerProfileData, FlowState } from '../store';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  goal?: string;
  interests?: string[];
  subjects?: string[];
  level?: string;
  availableTime?: string;
  onboardingCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export type XiraMemoryCategory =
  | 'recurring_error'
  | 'confidence_calibration'
  | 'difficulty_response'
  | 'intervention_effectiveness'
  | 'preferred_format';

export interface XiraEducationalMemory {
  id: string;
  userId: string;
  conceptId: string;
  conceptName: string;
  category: XiraMemoryCategory;
  strength: number; // 0.0 to 1.0 confidence/salience
  evidenceSummary: string;
  timestamp: number;
}

export interface QuestProgressRecord {
  questId: string;
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  attempts: number;
  completedAt?: number;
  updatedAt: number;
}

export interface EarnedBadge {
  badgeId: string;
  title: string;
  earnedAt: number;
}

export interface UserProgression {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  coins: number;
  rewardsCount: number;
  badges: EarnedBadge[];
  lastActiveDate: string;
}

export interface CanonicalUserData {
  userId: string;
  profile: UserProfile;
  activeGraphId: string;
  graphs: SkillGraph[];
  flowState: FlowState;
  progression: UserProgression;
  xiraMemories: XiraEducationalMemory[];
  questProgress: Record<string, QuestProgressRecord>;
  lastSyncedAt: number;
}

export interface AttemptPersistencePayload {
  userId: string;
  attempt: Attempt;
  conceptId: string;
  conceptName: string;
  graphId?: string;
  isIdempotentCheck?: boolean;
}

export interface PersistenceAdapter {
  getUserState(userId: string): Promise<CanonicalUserData | null>;
  saveUserState(userId: string, data: CanonicalUserData): Promise<boolean>;
  recordAttempt(payload: AttemptPersistencePayload): Promise<{ success: boolean; isDuplicate: boolean }>;
  recordXiraMemory(memory: XiraEducationalMemory): Promise<boolean>;
  getXiraMemories(userId: string, conceptId?: string): Promise<XiraEducationalMemory[]>;
  clearUserState(userId: string): Promise<boolean>;
}
