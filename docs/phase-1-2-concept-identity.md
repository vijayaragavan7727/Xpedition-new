# Phase 1 + 2 — Concept Identity & DC-Motor Decontamination

Status: implemented and verified locally (unit and browser). Production (Vercel) was **not** tested.

## Root cause being fixed

`/class?concept=periodic_table` showed "Chemistry • Mechanics", "Operational Dynamics", a generic
Inputs → Outputs diagram and "Try This: Use Fleming's Left Hand Rule". Concept identity was not lost.
The cause was that shared components supplied **DC-motor defaults** whenever a lesson lacked content:

| Symptom | Old cause |
|---|---|
| "• Mechanics" | literal in `ClassroomLayout` |
| "Operational Dynamics" | `getClassroomLesson()` synthesised a placeholder lesson for unknown ids |
| Generic Inputs/Outputs diagram | `GeneralDiagramRenderer` ignored the lesson |
| Fleming "Try This" on every concept | `SmartBoard` switch on `stepNumber` |
| Buddy frozen on intro; motor feedback | session dialogue overrode steps; orchestrator dialogue was DC-motor |
| `/class/<id>` showed the DC motor lesson | `getClassData()` defaulted to `dc_motor` |
| Motor text behind every class | backdrop PNG was a screenshot of the DC-motor class |

## New architecture

```
URL (?concept= | /class/<id>)  + ?intent=
        │
        ▼
components/classroom/ClassRoute.tsx      ← used by BOTH routes
        │ resolveClassLesson(raw, intent)
        ▼
lib/concepts/lessonResolver.ts           ← the ONE resolver
        │ normalise → EXACT lookup (id | explicit alias)
        ▼
lib/concepts/conceptRegistry.ts          ← CanonicalConcept registry (lazy-built)
   authored lessons (lib/classroom/classroomCatalog.ts + lib/classroom/lessons/*)
   ∪ curriculum topics (honest "outline" lessons, no invented quizzes)
        │ resolved | unavailable (explicit UI, never another concept)
        ▼
ClassroomLayout  key = conceptId|intent  (full remount on switch)
        │ useReducer(classRuntimeReducer)   ← lib/classroom/classRuntime.ts
        ├─ SmartBoard  → buildStepVisualPayload(concept, lesson, step)  (identity-stamped)
        │                → SmartBoardVisualRenderer (identity gate + registry dispatch)
        ├─ Buddy       ← selectBuddy(state)       (lesson steps + lesson buddyScript)
        └─ Xira        ← selectXiraContext(state) (lesson xiraPrompts, concept-scoped fallback)
```

### Canonical concept (`lib/concepts/types.ts`)
`id, subject, title, description, learningObjective, prerequisites, lessonId, lessonSource,
visualKind, availableStages, supportsRevision, aliases, metadata`.

### Lookup rules
- Normalisation is formatting only: trim, lower-case, spaces/hyphens → `_`.
- Match is exact against canonical ids or an explicit alias list. There is **no substring matching**.
- Unknown ids return `status: 'unavailable'` and the `ClassLessonUnavailable` screen.
- `matchSubjectRule` now matches whole tokens, so "revolution" no longer matches "evolution", and
  "software" no longer matches "war".

### Identity contract
- Every Smart Board payload carries `conceptId`, `subject`, `conceptVisual` (renderer family),
  `visualType`, `lessonId`, `stepId` and `stepIndex`.
- `acceptVisualPayload()` rejects a payload with missing or mismatched identity. It never relabels it.
- The renderer refuses any payload whose `conceptId` differs from the active concept.
- External or AI payloads may only supply optional artwork (`assetUrl`) for the same concept, step and
  request generation. The deterministic visual is always authoritative.
- Session, directive and external-visual responses are checked in the reducer. Stale ones are
  rejected and counted in `rejectedCount`.

### Persistence model (lesson state)
Lesson-scoped state is ephemeral: step, answers, hints, feedback, directive, artwork and session id.
Switching A → B → A starts A fresh at step 1. Learner-scoped data is not touched by the Class
reducer: mastery, XP, attempts and notes (now scoped per user and concept).

### Revision intent
`?intent=` is parsed by `parseClassIntent`, which accepts learn, revision, exam, gk, course and
project, and falls back to learn. Intent is carried through the resolution, runtime state, session
API (`session.intent`), identity probe and a header badge. With `intent=revision` the resolver also
exposes a `revisionPlan` (recap sequence plus retrieval question ids), and Buddy opens with the
lesson's `revisionIntroduction`. Adaptive revision (density, pacing, emphasis) is **not implemented yet**.

## Lessons
- **New, authored:**
  - `periodic_table`: 6 steps, deterministic interactive 118-element table (filters, trends, inspector, location challenges).
  - `polymorphism`: 5 steps, TypeScript dynamic-dispatch visualiser.
  - `calculus_derivatives`: 5 steps, derivative graph of f(x) = 0.4x³ − 1.2x with a movable tangent.
  - `industrial_revolution`: 6 steps, lesson-driven 9-milestone timeline.
- **Expanded:**
  - `projectile_motion`: 2 → 5 steps.
  - `human_heart_anatomy`: 1 → 5 steps.
- **Pedagogy moved into lesson data** for all pre-existing lessons (`lib/classroom/lessons/lessonPedagogy.ts`):
  Try This, common mistake, Buddy script (intro, revision intro, correct, incorrect, hint,
  transition, completion), Xira prompts and category.
- Flashcards were added to lessons that had none: quadratic, molecular, binary, French, regression.

## Tests
- `test/conceptIdentity.test.ts`: 23 behavioural tests, part of `npm test`.
- `test/classConceptIdentity.spec.ts`: Playwright, 11 concepts × 5 viewports.
  Run with `npm run test:e2e:class` against a running server.

## Known remaining items (not part of this phase)
- The Experience engine (`lib/experience/*` used by `/learn/[id]`, `/tutor`, `/quest`, the
  `/teach` universal container) still resolves topics by keywords. It is a separate system from the
  Class and should adopt the registry next.
- `components/TopBar.tsx` still derives a display title from URL keywords (display only).
- Home shows `dc_motor` as the explicit default first lesson for brand-new learners. This is a
  recommendation, not a fallback for another request.
- The 11-stage server orchestrator is still not driven stage-by-stage by the Class UI. Only the
  session is created, and it is identity-checked.
- `next build` fetches Google Fonts at build time. In the offline sandbox the build was verified
  with `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`, so a real networked build still needs to be confirmed.
- Buddy is still the procedural Three.js model, not a GLB (out of scope).
