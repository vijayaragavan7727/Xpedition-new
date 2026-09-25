'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CURRICULUM_SUBJECTS,
  CurriculumTopic,
} from '@/lib/curriculum/curriculumCatalog';
import {
  Atom,
  Calculator,
  FlaskConical,
  Dna,
  Code,
  BarChart3,
  BookOpen,
  Landmark,
  ArrowRight,
  Clock,
  Search,
  X,
  Check,
  CalendarDays,
  Map,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface TopicExplorerProps {
  currentConceptId?: string;
  initialSearch?: string;
  className?: string;
}

type LearningIntent = 'exam' | 'gk' | 'course' | 'revision' | 'project';

const INTENTS: Array<{ id: LearningIntent; title: string; description: string }> = [
  { id: 'exam', title: 'Exam preparation', description: 'Focus on syllabus coverage, practice and quick checks.' },
  { id: 'gk', title: 'General knowledge', description: 'Learn the important ideas without a long course plan.' },
  { id: 'course', title: 'Full course', description: 'Build a complete roadmap with a timetable and milestones.' },
  { id: 'revision', title: 'Quick revision', description: 'Refresh the core ideas and test retention quickly.' },
  { id: 'project', title: 'Project / application', description: 'Learn the concept through practical application and examples.' },
];

const subjectIcons: Record<string, React.ReactElement> = {
  Atom: <Atom />, Calculator: <Calculator />, FlaskConical: <FlaskConical />, Dna: <Dna />,
  Code: <Code />, BarChart3: <BarChart3 />, BookOpen: <BookOpen />, Landmark: <Landmark />,
};

function visualLabel(type: string) {
  const labels: Record<string, string> = {
    interactive_simulation: 'Interactive simulation',
    graph: 'Interactive graph',
    molecular_visual: 'Molecule visual',
    anatomical_visual: 'Anatomy visual',
    timeline: 'Timeline',
    code_visual: 'Code visual',
    formula_visual: 'Formula visual',
    scientific_diagram: 'Scientific diagram',
  };
  return labels[type] || 'Teaching visual';
}

function PurposeLearningPlan({ topic, intent }: { topic: CurriculumTopic; intent: LearningIntent }) {
  const sessionMinutes = Math.max(25, Math.min(45, topic.estimatedMinutes * 3));
  const weeks = topic.level === 'Advanced' ? 6 : topic.level === 'Intermediate' ? 5 : 4;
  const completionDate = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const roadmap = [
    `Foundations · terminology and mental model`,
    `Core mechanism · guided explanation + visual`,
    `Practice · questions and misconception correction`,
    `Application · mission and worked examples`,
    `Challenge · independent problem solving`,
    `Assessment · mastery evidence and revision`,
  ].slice(0, weeks === 4 ? 4 : weeks === 5 ? 5 : 6);

  const modules = [
    {
      title: 'Module 1: Foundations & Intuition',
      concepts: [`Intro to ${topic.title}`, 'Key Terminology', 'Core Physical Principle'],
      milestone: 'Milestone 1: Fundamentals Quiz',
    },
    {
      title: 'Module 2: Mechanism & Dynamic Visuals',
      concepts: ['System Interactions', 'State Transformations', 'Component Dependencies'],
      milestone: 'Milestone 2: Guided Simulation Test',
    },
    {
      title: 'Module 3: Quantitative Laws & Models',
      concepts: ['Governing Equations', 'Variable Relationships', 'Worked Numerical Examples'],
      milestone: 'Milestone 3: Problem Set Benchmarking',
    },
    {
      title: 'Module 4: Integration, Challenge & Mastery',
      concepts: ['Real-World Applications', 'Edge Cases & Misconceptions', 'Synthesis Project'],
      milestone: 'Final Milestone: Capstone Evaluation',
    },
  ];

  if (intent === 'exam') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800">Exam Preparation Plan</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">High Yield</span>
          </div>
          <h5 className="mt-1 font-serif font-bold text-sm text-amber-950">Syllabus-Aligned Rapid Mastery</h5>
          <p className="mt-1 text-xs text-amber-900/80">Structured for exam scoring: covers definition, core formulas, high-probability test questions, and common trap choices.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-white border border-[#E7E0D1] p-3">
            <span className="text-[10px] uppercase font-mono text-slate-500">Target Duration</span>
            <div className="font-bold text-slate-900 mt-0.5">2 Intensive Sessions</div>
          </div>
          <div className="rounded-xl bg-white border border-[#E7E0D1] p-3">
            <span className="text-[10px] uppercase font-mono text-slate-500">Assessment Check</span>
            <div className="font-bold text-slate-900 mt-0.5">Practice Questions & Diagnostic</div>
          </div>
        </div>
      </div>
    );
  }

  if (intent === 'gk') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-sky-300 bg-sky-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-800">General Knowledge Plan</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 text-[10px] font-bold">Intuition First</span>
          </div>
          <h5 className="mt-1 font-serif font-bold text-sm text-sky-950">Core Mental Model & Everyday Impact</h5>
          <p className="mt-1 text-xs text-sky-900/80">Understand how {topic.title} works in the real world in under 15 minutes, without dense mathematical overhead.</p>
        </div>
      </div>
    );
  }

  if (intent === 'revision') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">Quick Revision Plan</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">10 Min Recall</span>
          </div>
          <h5 className="mt-1 font-serif font-bold text-sm text-emerald-950">Rapid Concept & Formula Refresher</h5>
          <p className="mt-1 text-xs text-emerald-900/80">Refresh the essential definitions, formula relationships, and key takeaways with instant diagnostic questions.</p>
        </div>
      </div>
    );
  }

  if (intent === 'project') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-purple-300 bg-purple-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-800">Project / Application Plan</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-bold">Hands-On</span>
          </div>
          <h5 className="mt-1 font-serif font-bold text-sm text-purple-950">Applied Laboratory Simulation</h5>
          <p className="mt-1 text-xs text-purple-900/80">Direct hands-on exploration: adjust parameters, reverse polarities, and observe physical effects in real time.</p>
        </div>
      </div>
    );
  }

  // Full Course
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl bg-[#F7F4EC] border border-[#E7E0D1] p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Duration</div>
          <div className="mt-1 font-bold text-slate-900">{weeks} weeks</div>
        </div>
        <div className="rounded-xl bg-[#F7F4EC] border border-[#E7E0D1] p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Frequency</div>
          <div className="mt-1 font-bold text-slate-900">3 days / wk</div>
        </div>
        <div className="rounded-xl bg-[#F7F4EC] border border-[#E7E0D1] p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Session</div>
          <div className="mt-1 font-bold text-slate-900">{sessionMinutes} min</div>
        </div>
        <div className="rounded-xl bg-[#F7F4EC] border border-[#E7E0D1] p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Completion</div>
          <div className="mt-1 font-bold text-slate-900">{completionDate}</div>
        </div>
      </div>

      {/* Modules & Concept Breakdown */}
      <div className="rounded-2xl border border-[#E7E0D1] bg-white p-4">
        <div className="flex items-center gap-2 text-[#0F5132] font-bold text-sm">
          <GraduationCap className="w-4 h-4" /> Course Modules & Concepts
        </div>
        <div className="mt-3 space-y-3">
          {modules.map((mod, idx) => (
            <div key={mod.title} className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE7DF]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{mod.title}</span>
                <span className="text-[10px] font-mono text-[#0F5132] bg-[#E3EBE5] px-2 py-0.5 rounded-full">{mod.milestone}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {mod.concepts.map((c) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E0DBCF] text-slate-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E7E0D1] bg-white p-4">
        <div className="flex items-center gap-2 text-[#0F5132] font-bold text-sm">
          <Map className="w-4 h-4" /> Roadmap
        </div>
        <div className="mt-3 space-y-2">
          {roadmap.map((step, index) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E3EBE5] text-[#0F5132] text-[11px] font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="text-xs text-slate-700 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested schedule & assessment / revision points */}
      <div className="rounded-2xl border border-[#E7E0D1] bg-[#FBFAF6] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <CalendarDays className="w-4 h-4" /> Weekly timetable & Milestones
          </div>
          <span className="text-[10px] font-mono text-slate-500">Suggested schedule</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          {['Mon · Learn & Concept', 'Wed · Practice & Quiz', 'Sat · Challenge & Review'].map((day) => (
            <div key={day} className="rounded-lg bg-white border border-[#EBE7DF] px-2 py-2 text-center text-slate-700 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2.5 border-t border-[#EBE7DF] flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
          <span>• Assessment Points: Checkpoints after each module</span>
          <span>• Revision Points: Bi-weekly recall sessions</span>
          <span>• Challenge Points: Real-world applied problem</span>
        </div>
      </div>
    </div>
  );
}

export const TopicExplorer: React.FC<TopicExplorerProps> = ({
  currentConceptId = 'dc_motor',
  initialSearch = '',
  className = '',
}) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [selectedSubjectId, setSelectedSubjectId] = useState('physics');
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);
  const [intent, setIntent] = useState<LearningIntent | null>(null);

  React.useEffect(() => {
    setQuery(initialSearch);
  }, [initialSearch]);

  const allTopics = useMemo(() => CURRICULUM_SUBJECTS.flatMap((subject) => subject.topics), []);
  const selectedSubject = CURRICULUM_SUBJECTS.find((subject) => subject.id === selectedSubjectId) || CURRICULUM_SUBJECTS[0];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return selectedSubject.topics;
    return allTopics.filter((topic) => `${topic.title} ${topic.subject} ${topic.category} ${topic.description}`.toLowerCase().includes(q));
  }, [allTopics, query, selectedSubject.topics]);

  const startTopic = () => {
    if (!selectedTopic || !intent) return;
    router.push(`/class?concept=${encodeURIComponent(selectedTopic.conceptId)}&intent=${intent}`);
  };

  return (
    <section className={`w-full space-y-4 ${className}`}>
      <div className="rounded-2xl bg-white border border-[#EBE7DF] p-3.5 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#0F5132]"><Sparkles className="w-3.5 h-3.5" /> Discover learning</div>
            <h3 className="mt-1 font-serif font-black text-lg sm:text-xl text-slate-900">Search any available topic</h3>
            <p className="mt-1 text-xs text-slate-600">Search works like a learning library: type a concept, compare results, then choose why you want to learn it.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search physics, Python, algebra, heart..."
              className="w-full h-12 pl-10 pr-10 rounded-xl bg-[#F7F4EC] border border-[#E3DDCF] text-sm text-slate-900 outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/10"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CURRICULUM_SUBJECTS.map((subject) => {
              const active = subject.id === selectedSubjectId && !query;
              return (
                <button key={subject.id} type="button" onClick={() => { setSelectedSubjectId(subject.id); setQuery(''); }} className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${active ? 'bg-[#0F5132] text-white' : 'bg-[#FAF8F5] border border-[#EBE7DF] text-slate-700'}`}>
                  <span className="w-3.5 h-3.5 flex items-center justify-center">{React.cloneElement(subjectIcons[subject.iconName] || <BookOpen />, { className: 'w-3.5 h-3.5' })}</span>
                  {subject.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div><span className="font-serif font-black text-sm sm:text-base text-slate-900">{query ? 'Search results' : `${selectedSubject.title} topics`}</span><span className="ml-2 text-[11px] text-slate-500">{results.length} result{results.length === 1 ? '' : 's'}</span></div>
        <span className="hidden sm:inline text-[10px] font-mono text-slate-500">Select a result to choose your learning goal</span>
      </div>

      <div className="space-y-2.5">
        {results.map((topic) => {
          const isCurrent = topic.conceptId === currentConceptId;
          return (
            <button key={topic.conceptId} type="button" onClick={() => { setSelectedTopic(topic); setIntent(null); }} className={`w-full text-left rounded-2xl border bg-white p-3.5 sm:p-4 flex items-center gap-3 transition-all hover:shadow-md ${isCurrent ? 'border-[#0F5132] ring-1 ring-[#0F5132]/15' : 'border-[#EBE7DF] hover:border-slate-300'}`}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#F3F0E8] border border-[#E5DFD1] flex items-center justify-center text-[#0F5132] shrink-0"><BookOpen className="w-6 h-6" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F5132]">{topic.subject}</span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-[10px] text-slate-500">{topic.category}</span>
                  {isCurrent && <span className="ml-auto px-2 py-0.5 rounded-full bg-[#E3EBE5] text-[#0F5132] text-[9px] font-bold">Current</span>}
                </div>
                <h4 className="mt-1 font-serif font-black text-sm sm:text-base text-slate-900">{topic.title}</h4>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">{topic.description}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500"><span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {topic.estimatedMinutes} min</span><span>{topic.level}</span><span>{visualLabel(topic.visualType)}</span></div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          );
        })}

        {results.length === 0 && query.trim() && (
          <div className="rounded-2xl border border-dashed border-[#D7D0C0] bg-[#FBFAF6] p-6 text-center">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-2 font-semibold text-slate-700">No curated result yet — you can still start a topic class.</p>
            <p className="mt-1 text-xs text-slate-500">Xpedition will open a general learning session for your exact search term instead of sending you to a random topic.</p>
            <button
              type="button"
              onClick={() => {
                const conceptId = query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 80);
                setSelectedTopic({
                  conceptId: conceptId || 'custom_topic',
                  title: query.trim(),
                  subject: 'Custom topic',
                  description: `Start a focused learning session for ${query.trim()}.`,
                  estimatedMinutes: 10,
                  level: 'Beginner',
                  visualType: 'scientific_diagram',
                  category: 'Custom search',
                  keyTakeaway: "The class will begin with foundational context and build from the learner's goal.",
                });
                setIntent(null);
              }}
              className="mt-4 min-h-11 px-5 rounded-xl bg-[#0F5132] text-white text-xs font-bold"
            >
              Learn “{query.trim()}”
            </button>
          </div>
        )}
      </div>

      {selectedTopic && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm p-3 sm:p-6 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#FAF8F5] border border-[#E7E0D1] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E7E0D1]">
              <div className="min-w-0"><div className="text-[10px] font-mono uppercase tracking-wider text-[#0F5132]">{selectedTopic.subject}</div><h3 className="font-serif font-black text-lg text-slate-900 truncate">{selectedTopic.title}</h3></div>
              <button type="button" onClick={() => setSelectedTopic(null)} aria-label="Close topic chooser" className="w-9 h-9 rounded-full bg-white border border-[#E7E0D1] flex items-center justify-center text-slate-500"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="rounded-2xl bg-white border border-[#EBE7DF] p-4"><p className="text-xs text-slate-600 leading-relaxed">{selectedTopic.description}</p><div className="mt-3 text-[10px] text-slate-500">Core focus: <span className="font-semibold text-slate-700">{selectedTopic.keyTakeaway}</span></div></div>

              <div><h4 className="font-serif font-black text-base text-slate-900">Why do you want to learn this?</h4><div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INTENTS.map((item) => <button key={item.id} type="button" onClick={() => setIntent(item.id)} className={`text-left rounded-xl border p-3 transition-all ${intent === item.id ? 'border-[#0F5132] bg-[#EAF3ED] ring-1 ring-[#0F5132]/20' : 'border-[#E7E0D1] bg-white hover:border-slate-300'}`}><div className="flex items-center justify-between"><span className="font-bold text-sm text-slate-900">{item.title}</span>{intent === item.id && <Check className="w-4 h-4 text-[#0F5132]" />}</div><p className="mt-1 text-[11px] text-slate-500">{item.description}</p></button>)}
              </div></div>

              {intent && <PurposeLearningPlan topic={selectedTopic} intent={intent} />}

              <button type="button" disabled={!intent} onClick={startTopic} className="w-full min-h-12 rounded-xl bg-[#0F5132] disabled:bg-slate-300 text-white font-bold flex items-center justify-center gap-2">{intent === 'course' ? <GraduationCap className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />} {intent === 'course' ? 'Start Full Course' : 'Start Learning'} </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TopicExplorer;
