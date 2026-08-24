import { NextResponse } from 'next/server';
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface LessonChunk {
  say: string;
  code?: string;
}

interface LessonCheckpoint {
  ask: string;
  options: string[];
  answerIndex: number;
  why: string;
}

interface LessonResponse {
  chunks: LessonChunk[];
  checkpoint: LessonCheckpoint;
  provider?: string;
  latencyMs?: number;
  cached?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      conceptId = 'c_1',
      conceptName = 'Photosynthesis',
      conceptSummary = '',
      language = 'english',
      startingLevel = 'Complete beginner',
      masteryPercentage = 0,
      bypassCache = false,
    } = body;

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const masteryNum = Number(masteryPercentage) || 0;

    // Cache bucketing
    let masteryBand = 'new';
    if (masteryNum > 60) masteryBand = 'revision';
    else if (masteryNum > 0) masteryBand = 'partial';

    let levelBand = 'beginner';
    const normLevel = String(startingLevel).toLowerCase();
    if (normLevel.includes('deeper') || normLevel.includes('advanced')) levelBand = 'advanced';
    else if (normLevel.includes('basic') || normLevel.includes('intermediate')) levelBand = 'intermediate';

    // Fallback Lesson Generator if AI keys missing or offline
    const createFallbackLesson = (): LessonResponse => {
      const fallbackChunks: LessonChunk[] = [
        {
          say: `When you need to process data or understand ${conceptName}, you start by identifying the main bottleneck. Without this concept, your system runs inefficiently or produces wrong output.`,
        },
        {
          say: `${conceptName} breaks the problem into predictable, structured steps. Here is how it works in practice:`,
          code: `# Practical example of ${conceptName}\ndef process_example(data):\n    # Apply core rule\n    return [item for item in data if item]`,
        },
        {
          say: `A very common mistake is confusing the input setup with the execution result. Always verify your inputs before running the process.`,
        },
      ];

      return {
        chunks: fallbackChunks,
        checkpoint: {
          ask: `What is the primary purpose of ${conceptName}?`,
          options: [
            `To solve the core problem systematically`,
            `To slow down execution`,
            `To delete input data`,
            `To skip validation`,
          ],
          answerIndex: 0,
          why: `${conceptName} structures the solution into verifiable steps. Verifying inputs prevents unexpected runtime errors.`,
        },
      };
    };

    if (!groqApiKey && !geminiApiKey) {
      return NextResponse.json(createFallbackLesson());
    }

    const isRevision = masteryBand === 'revision';
    const chunkCountRule = isRevision
      ? 'Generate EXACTLY 2 concise revision chunks (this is a review for a learner with >60% mastery).'
      : 'Generate 3 to 5 chunks.';

    let languageRule = 'Write strictly in clear, conversational English.';
    if (language === 'tanglish') {
      languageRule = `Write strictly in TANGLISH (Tamil language written in Latin script, with all technical terms kept in English).
Example Tanglish tone: "Namma idhula main problem enna-na, data structure heavy-ah irukkumbodhu query slow aagum. Solution enna-na indexing verify panradhu thaan." Do NOT use Tamil script (தமிழ்). Use Latin script only.`;
    } else if (language === 'tamil') {
      languageRule = 'Write in Tamil script, keeping technical terms in English.';
    }

    const systemPrompt = `You are a world-class, engaging technical tutor.
Return ONLY valid minified JSON without markdown code fences, prose, or commentary.
Required JSON Schema:
{
  "chunks": [
    { "say": "40-70 words conversational chunk text", "code": "optional code snippet string or omit" }
  ],
  "checkpoint": {
    "ask": "Simple 1-sentence attention check question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0,
    "why": "Two sentence explanation of why this answer is correct."
  }
}

STRICT TEACHING & STRUCTURE RULES:
1. ${chunkCountRule} Each chunk MUST be 40 to 70 words long (the length someone speaks in 20 seconds).
2. CHUNK 1 MUST OPEN WITH THE PROBLEM THE CONCEPT SOLVES. Never start with a definition like "X is a...". Open directly with a concrete problem!
3. Language style: ${languageRule}
4. NO headings, NO bullet points, NO filler phrases like "In this lesson we will" or "Let's dive in".
5. One concrete example: If programming/code topic, put the snippet string in the "code" field. If science or theory, describe the concrete example in one natural sentence in "say".
6. Explicitly name the single most common misunderstanding in one of the middle chunks.
7. The checkpoint question tests basic attention/comprehension of the chunks. Provide 4 clear options and a valid 0-based answerIndex.
8. Adapt to starting level "${startingLevel}":
   - "Complete beginner": Simpler example, extra scaffolding.
   - "Know it, going deeper": Skip basics, jump directly to subtleties and memory/performance edge cases.`;

    const userPrompt = `Concept Name: "${conceptName}"
Concept Summary: "${conceptSummary}"
Learner Language: ${language}
Starting Level: ${startingLevel}
Current Mastery: ${masteryPercentage}% (${masteryBand} band)

Generate the complete interactive lesson now.`;

    const cacheKey = `lesson:${conceptName.toLowerCase().trim()}:${language}:${levelBand}:${masteryBand}`;

    const aiResult = await callAi<any>({
      systemPrompt,
      userPrompt,
      json: true,
      temperature: 0.3,
      maxTokens: 3500,
      bypassCache,
      cacheKey,
      route: '/api/lesson',
    });

    const parsed = aiResult.data;

    if (parsed && Array.isArray(parsed.chunks) && parsed.chunks.length >= 2 && parsed.checkpoint) {
      return NextResponse.json({
        chunks: parsed.chunks,
        checkpoint: {
          ask: parsed.checkpoint.ask || `What is the key takeaway of ${conceptName}?`,
          options: Array.isArray(parsed.checkpoint.options) && parsed.checkpoint.options.length >= 2
            ? parsed.checkpoint.options.slice(0, 4)
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          answerIndex: Number(parsed.checkpoint.answerIndex) || 0,
          why: parsed.checkpoint.why || `This checks fundamental understanding of ${conceptName}.`,
        },
        provider: aiResult.provider,
        latencyMs: aiResult.latencyMs,
        cached: aiResult.cached,
      });
    }

    return NextResponse.json(createFallbackLesson());
  } catch (e) {
    console.error('Lesson API Error:', e);
    return NextResponse.json({
      chunks: [
        { say: `To solve complex problems, you need to break down how data and logic flow.` },
        { say: `Always verify your assumptions before running production steps.` },
      ],
      checkpoint: {
        ask: `What is the first step in applying this concept?`,
        options: [`Verify assumptions`, `Ignore errors`, `Delete data`, `Skip testing`],
        answerIndex: 0,
        why: `Verifying assumptions ensures you don't build on top of invalid data.`,
      },
    });
  }
}
