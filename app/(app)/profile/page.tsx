'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoreData, saveLearnerProfile, clearStoreData, UserStoreData } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Save, LogOut, Download, Trash2, Check, User, Clock3, GraduationCap } from 'lucide-react';
import { HomeDesktopSidebar, HomeMobileBottomNav } from '@/components/home/HomeNavigation';

export default function ProfilePage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'english' | 'tanglish' | 'tamil'>('english');
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [startingLevel, setStartingLevel] = useState('Complete beginner');
  const [learningMode, setLearningMode] = useState<'tutor' | 'read' | 'quest'>('tutor');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  useEffect(() => {
    const data = getStoreData();
    setStoreData(data);
    setName(data.learnerProfile?.name || data.handle || 'Explorer');
    setLanguage(data.learnerProfile?.language || 'english');
    setDailyMinutes(data.learnerProfile?.dailyMinutes || 60);
    setStartingLevel(data.learnerProfile?.startingLevel || 'Complete beginner');
    setLearningMode(data.learnerProfile?.learningMode || 'tutor');
  }, []);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    saveLearnerProfile({ name: name.trim() || 'Explorer', language, dailyMinutes, startingLevel, learningMode });
    setStoreData(getStoreData());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
    setSaving(false);
  };

  const exportData = () => {
    const payload = { format: 'Xpedition Learner Data Archive', version: '1.0.0', exportedAt: new Date().toISOString(), storeData: getStoreData() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xpedition-learning-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut().catch(() => {});
    clearStoreData();
    sessionStorage.clear();
    router.push('/login');
  };

  const deleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    await fetch('/api/user/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT_AND_DATA' }) }).catch(() => {});
    try {
      const { persistenceManager } = await import('@/lib/persistence');
      await persistenceManager.clearUserState();
    } catch {}
    clearStoreData();
    localStorage.clear();
    sessionStorage.clear();
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut().catch(() => {});
    router.push('/');
  };

  if (!storeData) return <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">Loading profile…</div>;

  const initials = (name || 'Explorer').trim().charAt(0).toUpperCase();
  const goal = storeData.goalText || 'Your Learning Journey';

  return (
    <div className="min-h-[100dvh] w-full bg-[#FAF8F5] text-slate-900 flex flex-col md:flex-row overflow-x-hidden">
      <HomeDesktopSidebar />
      <main className="flex-1 min-w-0 min-h-[100dvh] overflow-y-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-10">
        <div className="max-w-3xl mx-auto space-y-5 pb-12">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#0F5132]">Your account</p><h1 className="mt-1 font-serif text-2xl sm:text-3xl font-black">Profile</h1><p className="mt-1 text-xs sm:text-sm text-slate-500">Keep your learning setup simple and personal.</p></div>
          <Link href="/home" className="text-xs font-semibold text-[#0F5132] hover:underline">Back to Home</Link>
        </div>

        <section className="rounded-3xl bg-white border border-[#EBE7DF] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#184E38] text-white flex items-center justify-center text-xl font-black shadow-sm">{initials}</div>
            <div className="min-w-0"><h2 className="font-serif font-black text-lg truncate">{name || 'Explorer'}</h2><p className="text-xs text-slate-500 truncate">{goal}</p></div>
          </div>
        </section>

        <form onSubmit={save} className="rounded-3xl bg-white border border-[#EBE7DF] p-4 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2"><User className="w-4 h-4 text-[#0F5132]" /><h2 className="font-serif font-black text-base">Learning setup</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Name</span><input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 rounded-xl border border-[#DDD6C8] bg-[#FAF8F5] px-3 text-sm outline-none focus:border-[#0F5132]" /></label>
            <label className="space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Language</span><select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)} className="w-full h-11 rounded-xl border border-[#DDD6C8] bg-[#FAF8F5] px-3 text-sm outline-none focus:border-[#0F5132]"><option value="english">English</option><option value="tanglish">Tanglish</option><option value="tamil">Tamil</option></select></label>
            <label className="space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Daily study time</span><select value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value))} className="w-full h-11 rounded-xl border border-[#DDD6C8] bg-[#FAF8F5] px-3 text-sm outline-none focus:border-[#0F5132]"><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option><option value={120}>2 hours</option></select></label>
            <label className="space-y-1.5"><span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Starting level</span><select value={startingLevel} onChange={(e) => setStartingLevel(e.target.value)} className="w-full h-11 rounded-xl border border-[#DDD6C8] bg-[#FAF8F5] px-3 text-sm outline-none focus:border-[#0F5132]"><option>Complete beginner</option><option>Some basics</option><option>Intermediate</option><option>Advanced</option></select></label>
          </div>

          <div><div className="flex items-center gap-2 mb-2"><GraduationCap className="w-4 h-4 text-[#0F5132]" /><span className="text-xs font-bold">Learning mode</span></div><div className="grid grid-cols-3 gap-2">{(['tutor','read','quest'] as const).map((mode) => <button key={mode} type="button" onClick={() => setLearningMode(mode)} className={`min-h-11 rounded-xl border text-xs font-bold capitalize ${learningMode === mode ? 'bg-[#E3EBE5] border-[#9BC9AD] text-[#0F5132]' : 'bg-[#FAF8F5] border-[#DDD6C8] text-slate-600'}`}>{mode}</button>)}</div></div>

          <div className="flex items-center justify-between gap-3 pt-1"><span className="text-xs text-slate-500">{saved ? 'Saved successfully.' : 'Changes apply to future lessons.'}</span><button type="submit" disabled={saving} className="min-h-11 px-5 rounded-xl bg-[#184E38] text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50">{saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}{saved ? 'Saved' : 'Save changes'}</button></div>
        </form>

        <section className="rounded-3xl bg-white border border-[#EBE7DF] p-4 sm:p-6 shadow-sm space-y-3">
          <h2 className="font-serif font-black text-base">Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><button type="button" onClick={exportData} className="min-h-11 rounded-xl border border-[#DDD6C8] bg-[#FAF8F5] text-xs font-bold text-slate-700 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Export learning data</button><button type="button" onClick={signOut} className="min-h-11 rounded-xl border border-[#DDD6C8] bg-[#FAF8F5] text-xs font-bold text-slate-700 flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Sign out</button></div>
          <button type="button" onClick={() => setShowDanger((value) => !value)} className="text-[11px] text-slate-400 hover:text-rose-600">Account deletion</button>
          {showDanger && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-3"><div className="flex items-center gap-2 text-rose-700 text-xs font-bold"><Trash2 className="w-4 h-4" /> Permanently delete your account data</div><input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Type DELETE" className="w-full h-11 rounded-xl border border-rose-200 bg-white px-3 text-sm outline-none" /><button type="button" disabled={deleteText !== 'DELETE' || deleting} onClick={deleteAccount} className="min-h-11 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-40">{deleting ? 'Deleting…' : 'Delete account'}</button></div>}
        </section>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400"><Clock3 className="w-3 h-3" /> Xpedition adapts your learning journey from your progress.</div>
        </div>
      </main>
      <HomeMobileBottomNav />
    </div>
  );
}
