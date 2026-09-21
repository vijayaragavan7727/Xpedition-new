import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/serverAuth';
import {
  runIntelligence,
  defaultDecisionEngine,
  LearnerState,
  executeLearningAction,
  LearningAction,
  ExecutionContext,
} from '@/lib/intelligence';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requireServerAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const body = await request.json().catch(() => ({}));
    const { message = '', context = {} } = body;

    const rawTrimmed = String(message).trim();
    if (!rawTrimmed) {
      return NextResponse.json({ reply: "I'm here! What would you like to explore today?" });
    }
    const trimmedMessage = rawTrimmed.slice(0, 1000);

    const {
      scope = 'home',
      concept = 'Core Topic',
      chunk = '',
      theta = -0.4,
      language = 'english',
      name = 'Learner',
      goal = 'Skill Goal',
      concepts = [],
      fadingConcepts = [],
      executeAction = undefined,
      misconception = '',
      hintsUsed = 0,
      stepTitle = '',
    } = context;

    // Direct Capability Execution when explicitly requested
    if (executeAction) {
      const execContext: ExecutionContext = {
        learnerGoal: goal,
        conceptName: concept,
        language,
        userQuery: trimmedMessage,
        mastery: Math.round(100 / (1 + Math.exp(-Number(theta || -0.4)))),
      };
      const execResult = await executeLearningAction(executeAction as LearningAction, execContext);
      let replyText = execResult.learnerFacingMessage || "Here is your learning lesson.";
      if (execResult.content && typeof execResult.content === 'object') {
        const c: any = execResult.content;
        if (c.explanation) {
          replyText = `${c.title ? `### ${c.title}\n\n` : ''}${c.explanation}\n\n**Example:** ${c.example || ''}\n\n**Check:** ${c.checkQuestion || ''}`;
        } else if (c.findings) {
          replyText = `${c.findings}\n\n${c.sources?.length ? `*Sources:* ${c.sources.map((s: any) => s.title).join(', ')}` : ''}`;
        }
      }
      return NextResponse.json({
        reply: replyText,
        executionResult: execResult,
      });
    }

    // Direct Document-Grounded Learning when document context or notes query is detected
    if (context.document || context.documentChunks || (context.documents && context.documents.length > 0)) {
      const execContext: ExecutionContext = {
        learnerGoal: goal,
        conceptName: concept,
        language,
        userQuery: trimmedMessage,
        document: context.document,
        documents: context.documents,
        documentChunks: context.documentChunks,
      };
      const docExecResult = await executeLearningAction('DOCUMENT_GROUNDED_QA', execContext);
      if (docExecResult.success && docExecResult.content) {
        const c: any = docExecResult.content;
        let replyText = c.answer || c.explanation;
        if (c.sourceReferences?.length > 0) {
          const sourcesStr = c.sourceReferences
            .map((s: any) => `${s.documentTitle}${s.pageNumber ? ` (p. ${s.pageNumber})` : ''}`)
            .join(', ');
          replyText += `\n\n*Source: ${sourcesStr}*`;
        }
        if (c.checkQuestion) {
          replyText += `\n\n**Check:** ${c.checkQuestion}`;
        }
        return NextResponse.json({
          reply: replyText,
          executionResult: docExecResult,
        });
      }
    }

    // Derive pedagogical next best action for XIRA companion guidance
    const partialState: Partial<LearnerState> = {
      goalText: goal,
      currentConceptName: concept,
      language,
      masteryPercentage: Math.round(100 / (1 + Math.exp(-Number(theta || -0.4)))),
      fadingConcepts: Array.isArray(fadingConcepts) ? fadingConcepts : [],
      weakConcepts: Array.isArray(concepts) ? concepts.filter((c: any) => (c.masteryPercentage || 0) < 60) : [],
    };

    const nextAction = defaultDecisionEngine.decideNextAction(partialState, trimmedMessage);

    let systemPrompt = '';

    if (scope === 'classroom') {
      systemPrompt = `You are XIRA, the cognitive classroom intelligence in Xpedition.
Active Lesson Topic: ${concept}
Current Lesson Step: "${stepTitle || chunk || 'Core Concept'}"
Learner Ability Level (theta): ${theta}
Pedagogical Action: ${nextAction.action} (${nextAction.reason})
${misconception ? `Detected Misconception to Clarify: ${misconception}` : ''}
${hintsUsed > 0 ? `Hints Requested by Learner: ${hintsUsed}` : ''}

Your task: Provide concise, targeted cognitive coaching that clears confusion and redirects the learner back to the Smart Board.
Structure your answer concisely:
- Key idea: Direct insight addressing the exact concept or misconception (under 30 words).
- Why this matters: The physical cause-and-effect relationship (1-2 sentences).
- Action in Class: Tell them what to look for on the Smart Board or test using the classroom tools.

Rules:
1. Ground answers strictly in ${concept} and the current lesson step.
2. Directly address misconceptions without lecturing.
3. Keep the total response under 80 words.
4. Encourage doing and observing on the Smart Board.`;
    } else if (scope === 'tutor') {
      systemPrompt = `You are XYRA, the classroom AI teacher in XPedition.
Current Concept: ${concept}
Current Lesson Chunk: "${chunk || 'Core Concept introduction'}"
Learner Ability Level (theta): ${theta}
Learner Name: ${name}
Preferred Language: ${language}
Pedagogical Focus: ${nextAction.action} (${nextAction.reason})

Rules:
1. Answer ONLY about "${concept}" or directly related technical principles.
2. Keep answers concise, plain, and strictly under 80 words.
3. End with one engaging follow-up question to check their understanding.
4. Never reveal direct quiz answers — provide helpful scaffolding hints.
5. If the user asks something completely unrelated (e.g. general chit-chat, unrelated trivia): refuse kindly and redirect them back to ${concept} in ${language}.
6. Speak in a friendly, supportive teacher tone.`;
    } else if (scope === 'workspace') {
      systemPrompt = `You are XIRA, the cognitive intelligence and study guide in XPedition.
Target Topic: ${concept}
Learner Goal: ${goal}
Learner Ability Level (theta): ${theta}
Pedagogical Recommendation: ${nextAction.action} (${nextAction.reason})
Language: ${language}

Your task: Provide active learning guidance that moves the student toward DOING.
Structure your answer with these concise sections:
- A concise, intuitive explanation (1-2 sentences, strictly under 40 words).
- Key idea: State the single most important mental model or rule.
- Try this: A short concrete example, edge case, or thought experiment.
- Quick Check: Ask ONE active recall question to check their understanding.

Rules:
1. Never give a long generic dump.
2. Focus strictly on learning and comprehension of ${concept}.
3. Keep the total response under 90 words.
4. Maintain a supportive, inspiring educational tone.`;
    } else {
      systemPrompt = `You are XYRA, personal AI learning guide in XPedition.
Learner Name: ${name}
Active Learning Goal: ${goal}
Recommended Next Move: ${nextAction.action} — ${nextAction.reason}
Skill Graph Concepts & Mastery: ${JSON.stringify(concepts)}
Fading Concepts (Retention Risk): ${JSON.stringify(fadingConcepts)}
Preferred Language: ${language}

Rules:
1. Answer questions about what to study today, which concept is weakest, overall progress, or explain any concept from their skill graph.
2. Align your guidance naturally with the recommended next move (${nextAction.action}) when asked what to do next.
3. Keep answers helpful, encouraging, and strictly under 80 words.
4. If the user asks something completely unrelated to their study plan or skills: refuse politely in ${language} and suggest a quick learning activity instead.
5. Maintain a warm, encouraging teacher voice.`;
    }

    const userPrompt = `Learner asks: "${trimmedMessage}"`;

    // Dispatch through the Xpedition Intelligence Layer
    const { result } = await runIntelligence<string>({
      systemPrompt,
      userPrompt,
      query: trimmedMessage,
      json: false,
      temperature: 0.5,
      maxTokens: 200,
      route: '/api/chat',
      learnerContext: partialState,
    });

    if (result && result.text) {
      return NextResponse.json({
        reply: result.text.trim(),
        nextAction,
        conceptId: nextAction.targetConceptId || 'projectile_motion',
        conceptName: nextAction.targetConceptName || concept,
      });
    }

    const fallback = scope === 'classroom'
      ? `Regarding ${concept} (${stepTitle || 'Current Step'}):\n\nKey idea: Focus on how the underlying variables interact.\n\nTry this: Observe the visual demonstration on the Smart Board to see the cause and effect in action!`
      : scope === 'workspace'
      ? `${concept} is a fundamental concept in your learning pathway. Key idea: Analyze the governing rules step by step. Try this: What changes if the primary parameter is doubled? Quick Check: How would you verify this in Class?`
      : scope === 'tutor'
      ? `Focus on the core mechanism of ${concept}. What happens when you apply this rule in practice?`
      : `Keep up your momentum on ${goal}! Would you like to practice your next concept today?`;

    return NextResponse.json({
      reply: fallback,
      nextAction,
      conceptId: nextAction.targetConceptId || 'projectile_motion',
      conceptName: nextAction.targetConceptName || concept,
    });
  } catch (err: any) {
    console.error('XYRA Chat API Error:', err);
    return NextResponse.json({
      reply: "I'm having a brief connection pause. Let's keep exploring our learning path!",
    });
  }
}
