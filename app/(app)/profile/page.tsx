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
  AlertTriangle,
  FileText,
  Compass,
  ArrowRight,
  CheckCircle2,
  Download,
  Cpu,
  Lock,
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

  // Phase E: User Data Controls (Export & Deletion)
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');

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
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('SignOut error:', err);
      }
    }
    clearStoreData();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    router.push('/login');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // 1. Try server-side export endpoint
      const res = await fetch('/api/user/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xpedition-learning-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        return;
      }

      // 2. Client-side state fallback for local offline mode
      const current = getStoreData();
      const exportBlob = new Blob(
        [
          JSON.stringify(
            {
              format: 'Xpedition Learner Data Archive (Client Export)',
              version: '1.0.0',
              exportedAt: new Date().toISOString(),
              storeData: current,
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      );
      const url = window.URL.createObjectURL(exportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xpedition-learning-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('[Profile] Export error:', err);
      alert('Could not export learning data. Please check network connection.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      alert('Please type DELETE exactly to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Call server-side deletion endpoint
      await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT_AND_DATA' }),
      });
    } catch (err) {
      console.warn('[Profile] Server deletion notice:', err);
    }

    // 2. Clean all local and session persistence
    try {
      const { persistenceManager } = await import('@/lib/persistence');
      await persistenceManager.clearUserState();
    } catch {
      // ignore
    }

    clearStoreData();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    setDeleteModalOpen(false);
    setIsDeleting(false);
    router.push('/');
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
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#141826]/90 border border-white/[0.07]">
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
      <Card variant="default" className="p-5 sm:p-6 border-white/[0.07] bg-[#141826]/90 space-y-5">
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
                className="w-full h-11 px-3.5 rounded-xl bg-[#0F121C] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
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
                className="w-full h-11 px-3.5 rounded-xl bg-[#0F121C] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer"
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
                className="w-full h-11 px-3.5 rounded-xl bg-[#0F121C] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-sans cursor-pointer"
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
                        : 'h-11 rounded-xl border font-sans text-xs font-semibold transition-all cursor-pointer bg-[#0F121C] border-white/[0.1] text-slate-400 hover:text-white'
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
                      : 'p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-[#0F121C] border-white/[0.1] text-slate-400 hover:text-white hover:border-white/20'
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
      <Card variant="default" className="p-5 sm:p-6 border-white/[0.07] bg-[#141826]/90 space-y-4">
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
                    : 'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all bg-[#0F121C] border-white/[0.06] text-slate-400'
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
          4. PRIVACY & USER DATA CONTROLS
          ========================================================================= */}
      <Card variant="default" className="p-5 sm:p-6 border-white/[0.07] bg-[#141826]/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h2 className="font-sans font-bold text-sm text-white">Privacy & Data Controls</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Self-Sovereign Data
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          You own your learning journey. Export all your Bayesian Knowledge Tracing mastery records,
          attempt histories, and progression as JSON, or permanently purge your account.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportData}
            disabled={isExporting}
            leftIcon={<Download className="w-4 h-4 text-cyan-400" />}
          >
            {isExporting ? 'Exporting...' : 'Export Learning Data (JSON)'}
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => {
              setDeleteConfirmationText('');
              setDeleteModalOpen(true);
            }}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Account & Data
          </Button>
        </div>
      </Card>

      {/* =========================================================================
          5. LEGAL TRANSPARENCY & TRUST CENTER
          ========================================================================= */}
      <Card variant="default" className="p-5 sm:p-6 border-white/[0.07] bg-[#141826]/90 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-bold text-sm text-white">Legal Transparency & Governance</h2>
          <Link
            href="/trust"
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
          >
            <span>Visit Trust Center</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
          <Link
            href="/privacy"
            className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-white">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Privacy Policy</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
          </Link>

          <Link
            href="/terms"
            className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-white">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Terms of Service</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
          </Link>

          <Link
            href="/ai-transparency"
            className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-white">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Transparency</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
          </Link>

          <Link
            href="/sources"
            className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-white">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Learning Sources</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
          </Link>

          <Link
            href="/disclaimer"
            className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between group transition-colors sm:col-span-2"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-white">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Educational Disclaimer</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
          </Link>
        </div>
      </Card>

      {/* =========================================================================
          6. ACCOUNT ACTIONS & SIGN OUT
          ========================================================================= */}
      <Card variant="default" className="p-5 sm:p-6 border-white/[0.07] bg-[#141826]/90 space-y-4">
        <h2 className="font-sans font-bold text-sm text-slate-300">Session Actions</h2>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button type="button" variant="outline" size="sm" onClick={handleResetData}>
            Reset Journey Progress
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111422] border border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Delete Account?</h3>
                <p className="text-xs text-rose-400 font-mono">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently wipe your profile, all concept mastery records, attempt histories,
              and educational memories from both our cloud database and local device storage.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-mono text-slate-400 block">
                Type <strong className="text-rose-400">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}