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
} from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="font-sans font-bold text-2xl text-white">Learner Profile & Settings</h1>
        <p className="font-sans text-xs text-slate-400 mt-1">
          Customize your cognitive model preferences, instruction dialect, and in-world character.
        </p>
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

          {/* Avatar Character Selection */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="font-mono text-[11px] uppercase font-bold text-slate-400">
              World Character Avatar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: 'learner', name: 'Explorer', role: 'Curious Pioneer', src: '/world/characters/learner.png' },
                { id: 'builder', name: 'Artisan', role: 'Master Builder', src: '/world/characters/builder.png' },
                { id: 'miner', name: 'Miner', role: 'Resource Pioneer', src: '/world/characters/miner.png' },
                { id: 'trainer', name: 'Tactician', role: 'Arena Combat Coach', src: '/world/characters/trainer.png' },
                { id: 'mentor', name: 'Scholar', role: 'Academy Guide', src: '/world/characters/mentor.png' },
              ].map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarId(av.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    avatarId === av.id
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg ring-1 ring-indigo-400'
                      : 'bg-[#090A0F] border-white/[0.12] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
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
