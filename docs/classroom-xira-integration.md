# Xpedition — Classroom & Xira Integration (Phase D4)

## 1. Architectural Overview

Phase 4 connects Phase 3 Visual Intelligence and Phase 2 ComfyUI Generation into the live Xpedition Classroom experience. Rather than treating the classroom as an isolated visual page, Phase 4 establishes a stateful, pedagogical orchestrator:

```
                    CLASS SESSION
                         │
                         ▼
                Classroom Intelligence
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Xira Classroom         Lesson Stage
       Orchestrator                 │
              │                     │
              └──────────┬──────────┘
                         ▼
              VisualRequirementEngine (Phase 3)
                         │
                         ▼
              SmartBoardVisualPayload
                         │
                         ▼
                    Smart Board (SmartBoardVisualRenderer)
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
           Buddy                  Student
             │                       │
             └───────────┬───────────┘
                         ▼
                 Classroom Telemetry
                         │
                         ▼
                  Xira Adaptation
                         │
                         ▼
                  Next Class Stage
```

### Key Invariants Preserved
1. **Dominant Teaching Surface**: Smart Board remains the focal visual center of the observatory classroom.
2. **Physical Co-presence**: 3D Buddy Robot Teacher stands beside the board, maintaining natural reactions and concise speech.
3. **Contextual Assistance**: Xira operates non-intrusively as an intelligence layer behind the scenes, offering diagnostic hints and misconception interventions only when needed.
4. **Tool Dock Continuity**: Bottom tool dock (Lesson, Questions, Audio, Hint, Notes, Formula, Flashcards, Sources) remains accessible throughout the lesson.

---

## 2. Classroom Stage Engine (`classroomStageController.ts`)

The session advances through an explicit pedagogical sequence:
```
INTRODUCE ──▶ EXPLAIN ──▶ DEMONSTRATE ──▶ INTERACT ──▶ QUESTION ──▶ FEEDBACK ──▶ PRACTICE ──▶ CHALLENGE ──▶ ASSESS ──▶ REWARD ──▶ NEXT
                                                         ▲             │
                                                         └──(retry)────┘
```

- `INTRODUCE`: High-level welcome and thematic hook; non-interactive conceptual overview.
- `EXPLAIN`: Mechanistic breakdown of components, force vectors, and principles.
- `DEMONSTRATE`: Dynamic walkthrough of rotation cycles and polarity switching.
- `INTERACT`: Direct student manipulation of interactive parameters and hot spots.
- `QUESTION`: Diagnostic check question anchoring mental models.
- `FEEDBACK`: Immediate evaluation. If correct, awards mastery and advances; if incorrect, surfaces targeted misconception advice and enables retry loop.
- `PRACTICE`: Guided application problem with contextual formulas.
- `CHALLENGE`: Diagnostic edge-case scenario (e.g., welded commutator fault).
- `ASSESS`: Unassisted formal assessment confirming independent competence.
- `REWARD`: Celebratory badge, XP granting, and mastery reflection.
- `NEXT`: Safe transition recommendation to the next frontier concept.

---

## 3. Xira Classroom Orchestrator (`XiraClassroomOrchestrator.ts`)

Coordinates classroom state deterministically:
- Evaluates `VisualRequirementEngine` on every stage transition.
- Generates `SmartBoardVisualPayload` to adapt the visual to the stage.
- Formulates concise Buddy dialogues and synchronous animation states (`INTRODUCING`, `EXPLAINING`, `CHALLENGING`, `THINKING`, `CELEBRATING`, `WAITING`).
- Tracks interaction counts, question attempts, and active misconceptions.
- Calculates bounded mastery levels:
  - `NOT_STARTED` (0 - 19)
  - `INTRODUCED` (20 - 39)
  - `DEVELOPING` (40 - 69)
  - `PRACTICING` (70 - 84)
  - `MASTERED` (85 - 100)

---

## 4. Smart Board Rendering Adapter (`SmartBoardVisualRenderer.tsx`)

Consumes `SmartBoardVisualPayload` without assuming all representations are static images:
- `scientific_diagram` / `educational_illustration`: Renders high-resolution technical diagrams with ambient rotational glow and clickable component hotspot pills.
- `interactive_simulation`: Live simulation viewport with active runtime parameters (voltage, flux, torque).
- `graph`: Deterministic SVG coordinate canvas for functional parabolas, roots, and vertices.
- `formula_visual`: Formatted mathematical derivation card with variable definitions.
- `timeline`: Chronological milestone sequence bar.
- `fallback`: Clean structured card ensuring the board **never breaks or renders blank**.

---

## 5. Classroom Telemetry (`classroomTelemetry.ts`)

Captures pedagogical events with strict privacy guarantees:
- Events: `CLASS_STARTED`, `STAGE_STARTED`, `STAGE_COMPLETED`, `VISUAL_SHOWN`, `VISUAL_INTERACTED`, `QUESTION_SHOWN`, `QUESTION_ANSWERED`, `ANSWER_CORRECT`, `ANSWER_INCORRECT`, `HINT_REQUESTED`, `RETRY_REQUESTED`, `FEEDBACK_SHOWN`, `CHALLENGE_STARTED`, `CHALLENGE_COMPLETED`, `ASSESSMENT_STARTED`, `ASSESSMENT_COMPLETED`, `REWARD_GRANTED`, `CLASS_COMPLETED`.
- **Sanitization**: Strips auth tokens, passwords, secrets, PII, and filesystem paths.
- **Memory Bounding**: Telemetry buffers are capped per session to prevent memory leaks.

---

## 6. End-to-End DC Motor Scenario

The canonical DC Motor lesson demonstrates the complete integrated flow:
1. **START / INTRODUCE**: Buddy welcomes learner; Smart Board displays introductory DC motor diagram.
2. **EXPLAIN**: Smart Board displays labeled schematic with Armature Coil, Split-Ring Commutator, Carbon Brushes, and N/S Poles.
3. **DEMONSTRATE**: Buddy explains continuous rotation and current reversal at $90^\circ$.
4. **INTERACT**: Student clicks hotspot or toggles rotation; telemetry records `VISUAL_INTERACTED`.
5. **QUESTION**: Multiple-choice check question presented on commutator role.
6. **INCORRECT**: Student chooses "Carbon Brushes alone"; Xira surfaces misconception clarification (`commutator_vs_brushes`); stage transitions to `FEEDBACK`.
7. **RETRY**: Student retries question.
8. **CORRECT**: Student chooses "Split-Ring Commutator"; Buddy celebrates; Xira surfaces praise; mastery score increases.
9. **PRACTICE**: Student applies torque linearity formula ($\tau \propto I$).
10. **CHALLENGE**: Diagnostic scenario on solid welded commutator; learner solves fault.
11. **ASSESS**: Independent assessment question completed successfully.
12. **REWARD**: Mastery level elevated; celebratory dialogue triggered.
13. **NEXT**: Next recommended concept (`projectile_motion`) queued safely.

---

## 7. Security Boundaries & API

### `POST /api/classroom/session`
- Protected by `requireServerAuth`.
- Strict validation of `conceptId`, `sessionId`, `learnerAction`.
- Strips any server disk paths or internal ComfyUI details before returning to client.

---

## 8. Future LLM Extension Points

The current Phase 4 implementation is **100% deterministic, explainable, and testable**, requiring 0 external AI tokens for orchestration. Future LLM reasoning (Phase 5) can replace individual decision interfaces:
- `IClassroomDecisionEngine` -> `LLMClassroomDecisionEngine`
- `IVisualNeedEvaluator` -> `LLMVisualNeedEvaluator`
The Smart Board UI contract, Buddy animation states, and classroom layout will remain unchanged when higher-level LLM agents are plugged in.
