'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getStoreData,
  saveStoreData,
  saveLearnerProfile,
  clearStoreData,
  switchActiveGraph,
  UserStoreData,
} from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { WorldThemeId } from '@/lib/themes';
import { Card, Button, Badge } from '@/components/ui';
import {
  User,
  Settings,
  Shield,
  BookOpen,
  Trash2,
  LogOut,
  Save,
  RotateCcw,
  Sparkles,
  AlertCircle,
  FileText,
  Compass,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const AVATARS = [
  { id: 'learner', name: 'Explorer', role: 'Curious Pioneer', src: '/world/characters/learner.png' },
  { id: 'builder', name: 'Artisan', role: 'Master Builder', src: '/world/characters/builder.png' },
  { id: 'miner', name: 'Miner', role: 'Resource Pioneer', src: '/world/characters/miner.png' },
  { id: 'trainer', name: 'Tactician', role: 'Arena Combat Coach', src: '/world/characters/trainer.png' },
  { id: 'mentor', name: 'Scholar', role: 'Academy Guide', src: '/world/characters/mentor.png' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [handle, setHandle] = useState<string>('');
  const [language, setLanguage] = useState<'english' | 'tanglish' | 'tamil'>('english');
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [learningMode, setLearningMode] = useState<'tutor' | 'read' | 'quest'>('tutor');
  const [avatarId, setAvatarId] = useState<string>('learner');
  const [startingLevel, setStartingLevel] = useState<string>('Complete beginner');
  const [currentWorldTheme, setCurrentWorldTheme] = useState<WorldThemeId>('cosmos');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const data = getStoreData();
    setStoreData(data);
    setHandle(data.handle || '');

    const activeGraph = data.graphs?.find((g) => g.id === data.activeGraphId);
    if (activeGraph?.learnerProfile) {
      setLanguage(activeGraph.learnerProfile.language || 'english');
      setDailyMinutes(activeGraph.learnerProfile.dailyMinutes || 60);
      setStartingLevel(activeGraph.learnerProfile.startingLevel || 'Complete beginner');
      setCurrentWorldTheme(activeGraph.learnerProfile.worldTheme || 'cosmos');
      setLearningMode(activeGraph.learnerProfile.learningMode || 'tutor');
      if (activeGraph.learnerProfile.avatar_id) {
        setAvatarId(activeGraph.learnerProfile.avatar_id);
      }
    } else if (data.learnerProfile) {
      setLanguage(data.learnerProfile.language || 'english');
      setDailyMinutes(data.learnerProfile.dailyMinutes || 60);
      setStartingLevel(data.learnerProfile.startingLevel || 'Complete beginner');
      setCurrentWorldTheme(data.learnerProfile.worldTheme || 'cosmos');
      setLearningMode(data.learnerProfile.learningMode || 'tutor');
      if (data.learnerProfile.avatar_id) {
        setAvatarId(data.learnerProfile.avatar_id);
      }
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      saveLearnerProfile({
        name: handle,
        language,
        dailyMinutes,
        startingLevel,
        worldTheme: currentWorldTheme,
        learningMode,
        avatar_id: avatarId,
      });

      setSaveSuccess(true);
      setStoreData(getStoreData());
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchGoal = (graphId: string) => {
    switchActiveGraph(graphId);
    setStoreData(getStoreData());
    router.refresh();
  };

  const handleDeleteGoal = (graphId: string) => {
    if (confirm('Are you sure you want to remove this learning pathway?')) {
      const current = getStoreData();
      const remaining = (current.graphs || []).filter((g) => g.id !== graphId);
      const newActive = current.activeGraphId === graphId ? remaining[0]?.id || '' : current.activeGraphId;
      saveStoreData({
        ...current,
        graphs: remaining,
        activeGraphId: newActive,
      });
      setStoreData(getStoreData());
    }
  };

  const handleResetData = () => {
    if (
      confirm(
        'WARNING: This will reset all your concept masteries, attempts, and streaks. Are you sure?'
      )
    ) {
      clearStoreData();
      router.push('/onboarding');
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    router.push('/login');
  };

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Profile...</span>
      </div>
    );
  }

  const activeAvatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];
  const goalTitle =
    storeData.goalText ||
    (storeData.concepts && storeData.concepts.length > 0
      ? 'Your Learning Journey'
      : 'Your Learning Path');

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-14 font-sans select-none">
      {/* =========================================================================
          1. PROFILE HEADER (Identity & Active Learning Goal)
          ========================================================================= */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#0D0F18]/90 border border-white/[0.08]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center p-1.5 shrink-0">
          <img
            src={activeAvatar.src}
            alt={activeAvatar.name}
            className="w-full h-full object-contain drop-shadow"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="font-sans font-bold text-lg sm:text-xl text-white truncate">
              {handle || 'Explorer'}
            </h1>
            <Badge variant="indigo" size="sm" className="text-[10px]">
              {activeAvatar.role}
            </Badge>
          </div>
          <p className="font-sans text-xs text-cyan-300 flex items-center gap-1.5 truncate">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{goalTitle}</span>
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-sans text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-sans text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* =========================================================================
          2. LEARNING PREFERENCES (Form)
          ========================================================================= */}
      <Card variant="default" className="p-5 sm:p-6 border-white/[0.08] bg-[#0D0F18]/90 space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h2 className="font-sans font-bold text-sm text-white">Learning Preferences</h2>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="learner-name" className="font-mono text-[11px] uppercase font-bold text-slate-400">
                Learner Name
              </label>
              <input
                id="learner-name"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-11 px-3.5 rounded-xl bg-[#090A0F] border border-white/[0.12] text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="learning-language" className="font-mono text-[11px] uppercase font-bold text-slate-400">
                Instruction Language
              </label>
              <select
                id="learning-language"
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
              <label htmlFor="daily-study-target" className="font-mono text-[11px] uppercase font-bold text-slate-400">
                Daily Study Target
              </label>
              <select
                id="daily-study-target"
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

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase font-bold text-slate-400">
                Primary Format
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'tutor', label: 'AI Tutor' },
                  { id: 'read', label: 'Reader' },
                  { id: 'quest', label: 'Quests' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setLearningMode(mode.id as any)}
                    className={
                      learningMode === mode.id
                        ? 'h-11 rounded-xl border font-sans text-xs font-semibold transition-all cursor-pointer bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'h-11 rounded-xl border font-sans text-xs font-semibold transition-all cursor-pointer bg-[#090A0F] border-white/[0.12] text-slate-400 hover:text-white'
                    }
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avatar Character Selection */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="font-mono text-[11px] uppercase font-bold text-slate-400">
              World Character Avatar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarId(av.id)}
                  className={
                    avatarId === av.id
                      ? 'p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-indigo-600/30 border-indigo-400 text-white shadow-lg ring-1 ring-indigo-400'
                      : 'p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-[#090A0F] border-white/[0.12] text-slate-400 hover:text-white hover:border-white/20'
                  }
                >
                  <img src={av.src} alt={av.name} className="w-10 h-10 object-contain drop-shadow" />
                  <span className="font-sans font-bold text-xs">{av.name}</span>
                  <span className="font-mono text-[9px] text-slate-400 text-center leading-tight">{av.role}</span>
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

      {/* =========================================================================
          3. LEARNING PATHWAYS (Path Management)
          ========================================================================= */}
      <Card variant="default" className="p-5 sm:p-6 border-white/[0.08] bg-[#0D0F18]/90 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="font-sans font-bold text-sm text-white">Learning Pathways</h2>
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
                className={
                  isActive
                    ? 'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all bg-[#181C2E] border-indigo-500/40 text-white'
                    : 'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all bg-[#090A0F] border-white/[0.06] text-slate-400'
                }
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

      {/* =========================================================================
          4. APP SETTINGS & LEGAL
          ========================================================================= */}
      <Card variant="default" className="p-5 sm:p-6 border-white/[0.08] bg-[#0D0F18]/90 space-y-3">
        <h2 className="font-sans font-bold text-sm text-white">App & Legal</h2>
        <div className="divide-y divide-white/[0.06]">
          <Link href="/terms" className="py-2.5 flex items-center justify-between group">
            <div className="flex items-center gap-2 text-xs text-slate-300 group-hover:text-white">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Terms of Service & Privacy</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </Card>

      {/* =========================================================================
          5. ACCOUNT ACTIONS & SIGN OUT
          ========================================================================= */}
      <Card variant="default" className="p-5 sm:p-6 border-rose-500/20 bg-[#0D0F18]/90 space-y-4">
        <h2 className="font-sans font-bold text-sm text-rose-400">Account Actions</h2>
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