'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getStoreData,
  clearStoreData,
  switchActiveGraph,
  saveLearnerProfile,
  saveStoreData,
  UserStoreData,
} from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { WORLD_THEMES, WorldThemeId, getThemeConfig } from '@/lib/themes';
import { Card, Button, Badge } from '@/components/ui';
import {
  User,
  Globe,
  Clock,
  Sparkles,
  Check,
  CheckCircle2,
  Shield,
  AlertCircle,
  Save,
  LogOut,
  RefreshCw,
  HelpCircle,
  X,
  Trash2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [showRecalibrateConfirm, setShowRecalibrateConfirm] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);

  // Editable Form Fields
  const [handle, setHandle] = useState<string>('Learner');
  const [language, setLanguage] = useState<'english' | 'tanglish' | 'tamil'>('english');
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [learningMode, setLearningMode] = useState<'tutor' | 'read' | 'quest'>('tutor');
  const [startingLevel, setStartingLevel] = useState<string>('Complete beginner');
  const [currentWorldTheme, setCurrentWorldTheme] = useState<WorldThemeId>('cosmos');

  // UI state
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      const store = getStoreData();
      setStoreData(store);

      if (store.handle) setHandle(store.handle);
      if (store.learnerProfile?.language) setLanguage(store.learnerProfile.language as any);
      if (store.learnerProfile?.dailyMinutes) setDailyMinutes(store.learnerProfile.dailyMinutes);
      if (store.learnerProfile?.learningMode) setLearningMode(store.learnerProfile.learningMode as any);
      if (store.learnerProfile?.startingLevel) setStartingLevel(store.learnerProfile.startingLevel);
      if (store.learnerProfile?.worldTheme) setCurrentWorldTheme(store.learnerProfile.worldTheme);

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;

          if (userId) {
            const { data: profileRow } = await supabase
              .from('profiles')
              .select('handle')
              .eq('id', userId)
              .single();

            if (profileRow?.handle) {
              setHandle(profileRow.handle);
            }

            const { data: learnerRow } = await supabase
              .from('learner_profile')
              .select('language, daily_minutes, learning_mode, starting_level, world_theme')
              .eq('user_id', userId)
              .maybeSingle();

            if (learnerRow) {
              if (learnerRow.language) setLanguage(learnerRow.language as any);
              if (learnerRow.daily_minutes) setDailyMinutes(learnerRow.daily_minutes);
              if (learnerRow.learning_mode) setLearningMode(learnerRow.learning_mode as any);
              if (learnerRow.starting_level) setStartingLevel(learnerRow.starting_level);
              if (learnerRow.world_theme && learnerRow.world_theme in WORLD_THEMES) {
                setCurrentWorldTheme(learnerRow.world_theme as WorldThemeId);
              }
            }
          }
        } catch (err) {
          console.warn('Supabase profile load notice:', err);
        }
      }
    };

    loadProfileData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const trimmedHandle = handle.trim() || 'Learner';
      const current = getStoreData();
      current.handle = trimmedHandle;

      const updatedProfile = {
        name: trimmedHandle,
        language,
        dailyMinutes,
        learningMode,
        startingLevel,
        worldTheme: currentWorldTheme,
      };

      const updatedStore = saveLearnerProfile(updatedProfile);
      updatedStore.handle = trimmedHandle;
      saveStoreData(updatedStore);
      setStoreData(updatedStore);

      if (isSupabaseConfigured && supabase) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (userId) {
          await supabase.from('profiles').upsert({
            id: userId,
            handle: trimmedHandle,
            updated_at: new Date().toISOString(),
          });

          await supabase.from('learner_profile').upsert({
            user_id: userId,
            language,
            daily_minutes: dailyMinutes,
            learning_mode: learningMode,
            starting_level: startingLevel,
            world_theme: currentWorldTheme,
            updated_at: new Date().toISOString(),
          });
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTheme = async (themeId: WorldThemeId) => {
    setCurrentWorldTheme(themeId);
    const updatedStore = saveLearnerProfile({ worldTheme: themeId });
    setStoreData(updatedStore);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          await supabase.from('learner_profile').upsert({
            user_id: userData.user.id,
            world_theme: themeId,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {}
    }

    setShowThemeModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSwitchGoal = (graphId: string) => {
    const updated = switchActiveGraph(graphId);
    setStoreData(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteGoal = (graphId: string) => {
    if (!storeData) return;
    const remaining = (storeData.graphs || []).filter((g) => g.id !== graphId);
    if (remaining.length === 0) return;

    const current = { ...storeData };
    current.graphs = remaining;
    if (current.activeGraphId === graphId) {
      current.activeGraphId = remaining[0].id;
      current.goalText = remaining[0].goalText;
      current.concepts = remaining[0].concepts || [];
      current.quests = remaining[0].quests || [];
      current.attempts = remaining[0].attempts || [];
    }
    saveStoreData(current);
    setStoreData(current);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all local data to fresh starting state?')) {
      clearStoreData();
      router.push('/onboarding');
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  const activeThemeConfig = getThemeConfig(currentWorldTheme);
  const themeList = Object.values(WORLD_THEMES);

  return (
    <div className="space-y-6 select-none pt-2 max-w-2xl mx-auto pb-24 font-sans">
      {/* Header */}
      <div>
        <h1 className="font-sans font-black text-2xl text-white tracking-tight">
          Profile & Settings
        </h1>
        <p className="font-sans text-xs text-slate-400 mt-0.5">
          Manage your account identity, learning style, and active goals.
        </p>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile settings saved successfully!</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold text-emerald-400">
            Synced
          </span>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-sans flex items-center gap-2 shadow-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 1. LEARNER PREFERENCES FORM */}
      <Card variant="default" className="p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="font-sans font-bold text-sm text-white">Learner Identity</h3>
          </div>
          <Badge variant="indigo" size="sm">
            AI Adaptive
          </Badge>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase font-bold text-slate-400">
              Display Name / Handle
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#090A0F] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase font-bold text-slate-400">
                Instruction Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#090A0F] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer"
              >
                <option value="english">English (Global)</option>
                <option value="tanglish">Tanglish (Conversational)</option>
                <option value="tamil">Tamil (தமிழ்)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase font-bold text-slate-400">
                Daily Study Target
              </label>
              <select
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#090A0F] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer"
              >
                <option value={15}>15 Minutes / Day</option>
                <option value={30}>30 Minutes / Day</option>
                <option value={60}>60 Minutes / Day</option>
                <option value={120}>2 Hours / Day</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase font-bold text-slate-400">
              Primary Learning Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'tutor', label: 'Interactive AI' },
                { id: 'read', label: 'Summary Reader' },
                { id: 'quest', label: 'Direct Quests' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setLearningMode(mode.id as any)}
                  className={`h-11 rounded-xl border font-sans text-xs font-semibold transition-all cursor-pointer ${
                    learningMode === mode.id
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-[#090A0F] border-white/[0.12] text-slate-400 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. ACTIVE LEARNING PATHWAYS */}
      <Card variant="default" className="p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="font-sans font-bold text-sm text-white">Learning Pathways</h3>
          </div>
          <Link href="/onboarding">
            <Button variant="outline" size="sm">
              + New Path
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          {storeData?.graphs?.map((graph) => {
            const isActive = graph.id === storeData.activeGraphId;
            return (
              <div
                key={graph.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isActive
                    ? 'bg-[#181C2E] border-indigo-500/40 text-white'
                    : 'bg-[#090A0F] border-white/[0.06] text-slate-400'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm text-white truncate">
                      {graph.goalText}
                    </span>
                    {isActive && (
                      <Badge variant="cyan" size="sm">
                        Active
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {graph.concepts?.length || 0} Concepts • {graph.attempts?.length || 0} Attempts
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSwitchGoal(graph.id)}
                    >
                      Switch
                    </Button>
                  )}
                  {storeData.graphs && storeData.graphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(graph.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete pathway"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. DANGER ZONE & SIGN OUT */}
      <Card variant="default" className="p-5 sm:p-7 space-y-4 border-rose-500/20">
        <h3 className="font-sans font-bold text-sm text-rose-400">Account Actions</h3>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button type="button" variant="danger" size="sm" onClick={handleResetData}>
            Reset Progress
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
