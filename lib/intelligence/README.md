# Xpedition Intelligence Architecture & Adaptive Experience Loop

The **Xpedition Intelligence Architecture** powers the pedagogical feedback, decision engine, and adaptive quest routing that drives learner progression across the platform.

---

## 1. Core Paradigm: Separation of Concerns

The architecture strictly separates responsibilities across the pedagogical loop:

| Layer | Responsibility | Question Answered | Canonical System |
|---|---|---|---|
| **Decision Engine** | **WHAT** | *What learning action should the student do next?* | `lib/intelligence/decisionEngine.ts` |
| **Experience Resolver** | **WHICH** | *Which concrete, registered experience fulfills that action?* | `lib/experience/nextExperienceResolver.ts` |
| **Quest Resolver** | **WHERE / ROUTE** | *Which canonical quest and route will the learner enter?* | `lib/experience/nextQuestResolver.ts` |
| **Experience Template** | **HOW** | *How is the interactive scene delivered and interacted with?* | `lib/experience/templates/*` |
| **Xira** | **SUPPORT** | *How should we explain, advise, and guide the learner?* | `lib/experience/xira/*` |

> **Critical Rule**: AI/LLMs **never** arbitrarily decide learner actions or next experiences. Deterministic cognitive and knowledge-tracing models remain the authoritative deciders. Xira serves as the pedagogical dialogue, interpretation, and explanation layer.

---

## 2. The Complete Adaptive Routing Loop (Milestone #6 & #7)

```
STUDENT INTERACTION
        ↓
EXPERIENCE TELEMETRY (code_edited, code_run, output_observed, etc.)
        ↓
EXPERIENCE OBSERVATION (repeated_assignment_pattern, successful_debugging)
        ↓
EXPERIENCE RESULT (completed, score, duration, hintsUsed, codeEvidence)
        ↓
LEARNER MODEL UPDATE (Bayesian Knowledge Tracing / Theta / Store Attempts)
        ↓
ASSESSMENT INTELLIGENCE (MISCONCEPTION, KNOWLEDGE_GAP, STRONG_MASTERY, etc.)
        ↓
RETENTION & EXAM INTELLIGENCE (Forgetting risk, urgency, exam readiness)
        ↓
DECISION ENGINE (PRACTICE_CONCEPT, CORRECT_MISCONCEPTION, HARDER_CHALLENGE)
        ↓
NEXT EXPERIENCE RESOLVER (Maps DecisionAction to registered ExperienceDefinition)
        ↓
NEXT QUEST RESOLVER (Maps DecisionAction + Concept -> Canonical Quest Target & Route)
        ↓
XIRA EXPLANATION (Provides humanized diagnostic insight without overriding decision)
        ↓
UI CONTINUATION (Learner clicks actual resolved action button -> Enters next activity)
```

---

## 3. Component Details

### 3.1 Adaptive Experience Loop (`lib/intelligence/adaptiveExperienceLoop.ts`)
The primary entry point:
```typescript
export function processAdaptiveExperienceLoop(
  result: ExperienceResult,
  storeData?: Partial<UserStoreData>
): AdaptiveExperienceLoopResult
```
1. **Normalizes Experience Evidence**: Extracts structured domain evidence (`CodeEvidence`, `AnatomyEvidence`, `MolecularEvidence`, etc.).
2. **Updates Learner Model**: Records the attempt into canonical store (`recordAttempt`, BKT parameters, concept mastery).
3. **Evaluates Assessment Signals**: Calls `evaluateExperienceAssessment` to classify pedagogical signals:
   - `KNOWLEDGE_GAP`: Low score + multiple attempts + hints required
   - `MISCONCEPTION`: Specific repeated error patterns (e.g., reassignment vs. accumulation)
   - `CONFIDENCE_MISALIGNMENT`: High subjective confidence paired with failure
   - `STRONG_MASTERY`: Independent success with high score and zero/minimal hints
   - `RECALL_FAILURE`: High prior mastery with sudden failure
4. **Evaluates Retention & Exam Readiness**: Inspects forgetting risk and spaced interval deadlines.
5. **Calls Decision Engine**: `DecisionEngine.decideNextAction(updatedLearnerState)` determines the authoritative next pedagogical action (`CORRECT_MISCONCEPTION`, `PRACTICE_CONCEPT`, `HARDER_CHALLENGE`, `REVIEW_CONCEPT`, etc.).
6. **Resolves Next Experience**: `resolveNextExperience(action, conceptId, learnerState)` verifies active registry membership or safely returns `available: false`.
7. **Resolves Next Quest Target & Route**: `resolveNextQuest({ action, conceptId, learnerState, resolvedExperience })`:
   - Binds to canonical quest definitions (`quest_python_debugging_01`, `quest_heart_anatomy_01`, etc.).
   - Computes deterministic navigation route (e.g. `/quest?concept=python_debugging_basics&mode=assisted` or `/experience/code`).
   - Assigns dynamic button labels (e.g. "Correct Misconception", "Try a Harder Challenge", "Continue Practice").
   - Provides safe fallback for non-experiential actions without inventing broken routes.
8. **Generates Xira Guidance**: `xiraExperienceAdvisor.generateAdaptiveNextStepGuidance` creates contextual, supportive pedagogical explanations.
9. **Emits Canonical Telemetry**: Records `adaptive_loop_started`, `learner_state_updated`, `assessment_signal_generated`, `next_action_selected`, `next_experience_resolved`, `next_quest_resolved`, and `adaptive_route_clicked`.

---

## 4. Architectural Invariants

1. **Deterministic Authority**: The Decision Engine is the sole source of truth for the next action.
2. **Canonical BKT & Learner Model**: No parallel learner models, duplicate mastery engines, or fabricated 100% mastery spikes from a single session.
3. **No Non-existent Experience Hallucination**: If no registered interactive experience matches the action/concept pair, the resolver cleanly returns `available: false` with a descriptive reason and safe fallback route.
4. **Route Safety & Refresh Integrity**: Routes are validated canonical URLs that survive client reload without losing state identity.
5. **Zero Arbitrary Code Execution**: No `eval`, `exec`, or unsafe child processes.
6. **Protected Systems Preserved**:
   - `lib/store.ts`
   - `lib/engine/mastery.ts`
   - `lib/engine/difficulty.ts`
   - `lib/intelligence/decisionEngine.ts`
   - `lib/bkt.ts`, `lib/flowController.ts`, `lib/bandit.ts`, `lib/arenaEngine.ts`, `lib/QuestContext.tsx`
