'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData, Attempt, ConceptMastery } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card, Button, Badge } from '@/components/ui';
import {
  History,
  Sparkles,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Clock,
  TrendingUp,
  Filter,
} from 'lucide-react';

interface SessionGroup {
  sessionId: string;
  conceptId: string;
  conceptName: string;
  dateStr: string;
  timeStr: string;
  timestamp: number;
  totalAttempts: number;
  correctCount: number;
  isSolo: boolean;
  masteryPercentage?: number;
  attempts: Attempt[];
}

export default function HistoryPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [filter, setFilter] = useState<'all' | 'solo' | 'assisted'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const store = getStoreData();
      setStoreData(store);

      let allAttempts: Attempt[] = [...(store.attempts || [])];

      // Query Supabase for cloud-persisted attempts
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;

          if (userId) {
            const { data: dbAttempts, error } = await supabase
              .from('quest_attempts')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (!error && dbAttempts && dbAttempts.length > 0) {
              const mappedDb: Attempt[] = dbAttempts.map((row: any) => ({
                id: row.id,
                conceptId: row.concept_id,
                conceptName: row.concept_name || 'Core Principle',
                isCorrect: row.is_correct,
                timestamp: new Date(row.created_at).getTime(),
                confidence: row.confidence_level || 'known',
                isSolo: row.is_solo || false,
                isVoid: row.is_void || false,
                itemHash: row.item_hash,
              }));

              const seenIds = new Set(allAttempts.map((a) => a.id));
              mappedDb.forEach((a) => {
                if (!seenIds.has(a.id)) {
                  allAttempts.push(a);
                  seenIds.add(a.id);
                }
              });
            }
          }
        } catch (e) {
          console.warn('History Supabase fetch error, using local attempts:', e);
        }
      }

      // Sort newest first
      allAttempts.sort((a, b) => b.timestamp - a.timestamp);

      // Group attempts by 10-minute session windows per concept
      const groups: SessionGroup[] = [];
      const sessionMap = new Map<string, Attempt[]>();

      allAttempts.forEach((att) => {
        if (att.isVoid) return;
        const bucketTime = Math.floor(att.timestamp / (10 * 60 * 1000)) * (10 * 60 * 1000);
        const groupKey = `${bucketTime}_${att.conceptId || 'default'}_${att.isSolo ? 'solo' : 'assisted'}`;

        if (!sessionMap.has(groupKey)) {
          sessionMap.set(groupKey, []);
        }
        sessionMap.get(groupKey)!.push(att);
      });

      sessionMap.forEach((attemptsInGroup) => {
        if (attemptsInGroup.length === 0) return;
        const first = attemptsInGroup[0];
        const dateObj = new Date(first.timestamp);
        const dateStr = dateObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const timeStr = dateObj.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        });

        const correct = attemptsInGroup.filter((a) => a.isCorrect).length;
        const concept = store.concepts?.find((c) => c.id === first.conceptId);

        groups.push({
          sessionId: `sess_${first.timestamp}_${first.conceptId}`,
          conceptId: first.conceptId,
          conceptName: first.conceptName || concept?.name || 'Core Topic',
          dateStr,
          timeStr,
          timestamp: first.timestamp,
          totalAttempts: attemptsInGroup.length,
          correctCount: correct,
          isSolo: first.isSolo || false,
          masteryPercentage: concept?.masteryPercentage || 0,
          attempts: attemptsInGroup,
        });
      });

      groups.sort((a, b) => b.timestamp - a.timestamp);
      setSessionGroups(groups);
      setLoading(false);
    };

    loadHistory();
  }, []);

  const filteredSessions = sessionGroups.filter((s) => {
    if (filter === 'solo') return s.isSolo;
    if (filter === 'assisted') return !s.isSolo;
    return true;
  });

  return (
    <div className="space-y-6 select-none pt-2 max-w-3xl mx-auto font-sans pb-14">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/[0.07] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <h1 className="font-sans font-bold text-2xl text-white">Learning History</h1>
          </div>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Review past learning sessions, quest accuracy, and concept progression over time.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141826] border border-white/[0.08] text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({sessionGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('solo')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'solo'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Solo
          </button>
          <button
            type="button"
            onClick={() => setFilter('assisted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'assisted'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Assisted
          </button>
        </div>
      </div>

      {/* Main Content List / Empty State */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-mono text-xs animate-pulse space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div>Loading learning logs & session telemetry...</div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card variant="default" className="p-8 sm:p-12 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-cyan-300 mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-sans font-bold text-base sm:text-lg text-white">
              No sessions yet — start learning!
            </h2>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              Complete your first adaptive quest on Home or start a classroom session with XIRA to log items and track mastery over time.
            </p>
          </div>
          <Link href="/home" className="inline-block">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Learning Now
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredSessions.map((session) => {
            const accuracy = Math.round((session.correctCount / session.totalAttempts) * 100);
            const isHighAccuracy = accuracy >= 70;

            return (
              <Card
                key={session.sessionId}
                variant="default"
                className="p-4 sm:p-5 space-y-3 hover:border-white/[0.14] transition-all"
              >
                {/* Session Top Line */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm sm:text-base text-white">
                      {session.conceptName}
                    </span>
                    {session.isSolo ? (
                      <Badge variant="indigo" size="sm">
                        <Shield className="w-3 h-3" />
                        Solo Quest
                      </Badge>
                    ) : (
                      <Badge variant="cyan" size="sm">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        AI Assisted
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{session.dateStr} &middot; {session.timeStr}</span>
                  </div>
                </div>

                {/* Session Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.06] text-xs font-mono">
                  {/* Total Items */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Questions</span>
                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5">{session.totalAttempts} items</span>
                  </div>

                  {/* Accuracy Score */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Accuracy</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isHighAccuracy ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-bold ${isHighAccuracy ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {session.correctCount}/{session.totalAttempts} ({accuracy}%)
                      </span>
                    </div>
                  </div>

                  {/* Mastery Percentage */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Mastery</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-cyan-300">
                        {session.masteryPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action */}
                <div className="flex items-center justify-end pt-1">
                  <Link
                    href={`/quest?concept=${encodeURIComponent(session.conceptId)}`}
                    className="text-xs font-sans font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Practice {session.conceptName} again</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
