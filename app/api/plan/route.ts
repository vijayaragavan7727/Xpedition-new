import { NextResponse } from 'next/server';
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PlanTopic {
  id: string;
  title: string;
  hours: number;
  why: string;
}

interface PlanMilestone {
  afterTopic: string;
  checkpoint: string;
}

interface StudyPlanResponse {
  totalHours: number;
  weeks: number;
  topics: PlanTopic[];
  milestones: PlanMilestone[];
  guidance?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      pathType = 'goal',
      topic = 'Python Programming',
      language = 'english',
      dailyMinutes = 60,
      startingLevel = 'Complete beginner',
      whyGoal = 'curiosity',
      deadlineDate = '',
      testDate = '',
      syllabusText = '',
      bypassCache = false,
    } = body;

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const mins = Number(dailyMinutes) || 60;
    const dailyHours = mins / 60;
    const weeklyHours = dailyHours * 7;
    const normWhy = String(whyGoal).toLowerCase();

    // Determine target total hours band based on explicit learner motivation
    let targetMinHours = 1;
    let targetMaxHours = 3;
    let targetTopicsCount = 3;

    if (normWhy.includes('job') || normWhy.includes('career') || normWhy.includes('work')) {
      targetMinHours = 20;
      targetMaxHours = 60;
      targetTopicsCount = 5;
    } else if (normWhy.includes('college') || normWhy.includes('assignment') || normWhy.includes('project')) {
      targetMinHours = 5;
      targetMaxHours = 12;
      targetTopicsCount = 4;
    } else if (normWhy.includes('exam') || normWhy.includes('test') || pathType === 'syllabus') {
      targetMinHours = 4;
      targetMaxHours = 16;
      targetTopicsCount = 4;
    } else {
      // Curiosity / Casual interest
      targetMinHours = 1;
      targetMaxHours = 3;
      targetTopicsCount = 3;
    }

    // Fallback Plan Generator
    const createFallbackPlan = (): StudyPlanResponse => {
      const fallbackHours = targetMinHours;
      const totalSessions = Math.ceil((fallbackHours * 60) / mins);
      const estWeeks = Math.max(1, Math.ceil(fallbackHours / weeklyHours));

      const topics: PlanTopic[] = [
        { id: 't1', title: `${topic} — Core Overview`, hours: Number((fallbackHours * 0.4).toFixed(1)), why: 'Key principles and high-level concepts.' },
        { id: 't2', title: `${topic} — Key Applications`, hours: Number((fallbackHours * 0.6).toFixed(1)), why: 'Practical examples and core mechanics.' },
      ];

      return {
        totalHours: fallbackHours,
        weeks: estWeeks,
        topics,
        milestones: [{ afterTopic: 't2', checkpoint: 'Knowledge verification' }],
        guidance: `About ${fallbackHours} hours — roughly ${totalSessions} sessions at ${mins} minutes a day.`,
      };
    };

    if (!groqApiKey && !geminiApiKey) {
      return NextResponse.json(createFallbackPlan());
    }

    const systemPrompt = `You are an honest, intent-scaled academic study planner.
Return ONLY valid minified JSON without markdown code fences, prose, or commentary.
Required JSON Schema:
{
  "totalHours": 2,
  "weeks": 1,
  "topics": [
    { "id": "t1", "title": "Topic Title", "hours": 1, "why": "One sentence rationale." }
  ],
  "milestones": [
    { "afterTopic": "t1", "checkpoint": "One sentence milestone checkpoint description." }
  ],
  "guidance": "About X hours — roughly Y sessions at Z minutes a day."
}

STRICT INTENT SCOPING RULES:
The user's learning motivation is "${whyGoal}". Scale the plan total hours strictly to match their intent:
- Curiosity / Casual interest: MUST be 1 to 3 hours TOTAL (3-4 concise topics). NEVER a 20-hour course.
- College work / Assignments: 5 to 12 hours TOTAL.
- Exam / Test preparation: 4 to 16 hours TOTAL, scoped to exam coverage over depth.
- Job / Career transition: 20 to 60 hours TOTAL, deep foundations included.

WEEK & SESSION PACING RECONCILIATION:
- Daily pace: ${mins} minutes/day (${weeklyHours.toFixed(1)} hours/week).
- Total sessions = Math.ceil((totalHours * 60) / ${mins}).
- Estimated weeks = Math.ceil(totalHours / ${weeklyHours.toFixed(1)}).
- Guidance format MUST be: "About [X] hours — roughly [Y] sessions at [Z] minutes a day."`;

    const userPrompt = `Learner Profile:
- Path: ${pathType}
- Main Topic: ${topic}
- Language: ${language}
- Daily Time: ${mins} minutes/day
- Starting Level: ${startingLevel}
- Motivation/Why: ${whyGoal} (Target Range: ${targetMinHours}-${targetMaxHours} hours)
- Target Deadline: ${deadlineDate || 'None'}
- Test Date: ${testDate || 'None'}
- Syllabus/Notes: ${syllabusText || 'None'}

Generate an intent-scaled, honest study plan now.`;

    const aiResult = await callAi<any>({
      systemPrompt,
      userPrompt,
      json: true,
      temperature: 0.3,
      maxTokens: 3000,
      bypassCache,
      cacheKey: `plan:${topic}:${whyGoal}:${mins}`,
      route: '/api/plan',
    });

    const parsed = aiResult.data;

    if (parsed && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
      let calcTotalHours = parsed.topics.reduce((acc: number, t: PlanTopic) => acc + (Number(t.hours) || 1), 0);

      // Clamp generated total hours to motivation band
      if (calcTotalHours > targetMaxHours) {
        calcTotalHours = targetMaxHours;
      } else if (calcTotalHours < targetMinHours) {
        calcTotalHours = targetMinHours;
      }

      const totalSessions = Math.ceil((calcTotalHours * 60) / mins);
      const calcWeeks = Math.max(1, Math.ceil(calcTotalHours / weeklyHours));

      return NextResponse.json({
        totalHours: calcTotalHours,
        weeks: calcWeeks,
        topics: parsed.topics,
        milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
        guidance: `About ${calcTotalHours} hours — roughly ${totalSessions} sessions at ${mins} minutes a day.`,
        provider: aiResult.provider,
        latencyMs: aiResult.latencyMs,
        cached: aiResult.cached,
      });
    }

    return NextResponse.json(createFallbackPlan());
  } catch (e) {
    console.error('Plan API Error:', e);
    return NextResponse.json({
      totalHours: 2,
      weeks: 1,
      topics: [
        { id: 't1', title: 'Core Principles', hours: 1, why: 'High-level overview' },
        { id: 't2', title: 'Key Applications', hours: 1, why: 'Practical breakdown' },
      ],
      milestones: [{ afterTopic: 't2', checkpoint: 'Completion verification' }],
      guidance: 'About 2 hours — roughly 8 sessions at 15 minutes a day.',
    });
  }
}
