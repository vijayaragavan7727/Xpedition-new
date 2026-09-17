# Xpedition Experience Engine v1 — Unified Orchestration Architecture

The **Experience Engine** converts abstract learning concepts into active, observable, interactive learning experiences. It embodies the core pedagogical paradigm of Xpedition:

$$\text{Concept} \longrightarrow \text{Experience} \longrightarrow \text{Student Interaction} \longrightarrow \text{Observation} \longrightarrow \text{Xira Guidance} \longrightarrow \text{Learner Model} \longrightarrow \text{Next Best Action}$$

---

## 1. Architectural Roles

- **Experience Engine (Body)**: Manages declarative experience definitions, scene parameters, interaction controls, deterministic validation, telemetry recording, and generic lifecycle state transitions.
- **Xira (Brain)**: The intelligence companion that observes telemetry events, identifies pedagogical principles, generates constructive guidance, and advises the Learner Model on mastery progression.
- **Learner Model (Memory)**: Translates experiential evidence into canonical Bayesian Knowledge Tracing (BKT) updates and informs the Decision Engine.

---

## 2. Core Abstractions

### `ExperienceDefinition` (`lib/experience/experienceDefinition.ts`)
The contract that every experience implements:
- `id`: Unique identifier (e.g. `'exp_projectile_motion_01'`)
- `type`: Experience key (e.g. `'PROJECTILE_SIMULATION'`)
- `conceptId`: Curricular concept (e.g. `'projectile_motion'`)
- `title` & `objective`: Student-facing description and goal
- `template`: Generic archetype (`'simulation'` | `'manipulation'` | `'builder'` | `'custom'`)
- `configuration`: Static or parameterized configuration
- `initialState`: Starting domain state
- `validator`: Pure function `(state, config) => CanonicalValidationResult`
- `feedbackGenerator`: Optional custom feedback generator
- `hints`: Progressive hint string array
- `predictionChallenge`: Optional pre-interaction hypothesis challenge

### `ExperienceRegistry` (`lib/experience/experienceRegistry.ts`)
A centralized, non-branching catalog of registered experiences:
```ts
import { experienceRegistry } from '@/lib/experience';

// Register experience
experienceRegistry.register('CIRCUIT_BUILDER', circuitDefinition);

// Resolve experience
const def = experienceRegistry.getExperienceDefinition('CIRCUIT_BUILDER');
```

### `ExperienceOrchestrator` (`lib/experience/experienceOrchestrator.ts`)
The universal lifecycle coordinator. It manages the generic state transitions:
$$\text{IDLE} \longrightarrow \text{STARTED} \longrightarrow (\text{PREDICTING}) \longrightarrow \text{INTERACTING} \longrightarrow \text{CHECKING} \longrightarrow \text{COMPLETED} \; / \; \text{NEEDS\_CORRECTION}$$

Deterministic Methods:
- `startExperience()`: Begins the session and enters `PREDICTING` or `INTERACTING`.
- `submitPrediction(optionId)`: Records learner hypothesis and advances to `INTERACTING`.
- `updateState(updater, eventPayload)`: Updates domain state and records interaction telemetry.
- `validate()`: Executes the definition's validator, records validation history, issues feedback, and updates lifecycle stage.
- `requestHint()`: Dispenses progressive hint feedback and records telemetry.
- `reset()`: Re-initializes state to baseline.
- `getResult()`: Synthesizes the final canonical `ExperienceResult`.

**CRITICAL INVARIANT**: The orchestrator contains **ZERO** physics formulas, **ZERO** valence tables, and **ZERO** matrix rotation equations. It coordinates contracts only.

---

## 3. Experience Templates (`lib/experience/templates/`)

Experiences are categorized into three core templates:

1. **SimulationExperience (`parameters → simulate → observe → validate`)**
   - Example: **Projectile Motion** (`PROJECTILE_SIMULATION`)
   - Adjust launch angle & velocity, compute parabolic path, check target distance.
2. **ManipulationExperience (`object → transform → target → tolerance → validate`)**
   - Example: **Scholar's Prism** (`OBJECT_MANIPULATION`)
   - Rotate 3D prism along 3 axes, measure angular divergence, lock on target reticle.
3. **BuilderExperience (`components → relationships → rules → target → validate`)**
   - Example: **Water Molecule Builder** (`MOLECULE_BUILDER`)
   - Connect atoms with covalent bonds, check valence constraints, verify octet stability.

---

## 4. Xira Observation & Advice Adapter (`lib/experience/xira/experienceObservation.ts`)

Converts generic telemetry events into deterministic educational observations:
- `target_not_reached`: Launch attempts repeatedly diverged from target distance.
- `repeated_axis_adjustment`: Multiple continuous rotations across coupled axes.
- `bonding_rule_misunderstanding`: Attempted illegal H-H covalent bond.
- `valence_capacity_reached`: Attempted to add bonds beyond maximum valence.

Observations map to standard `XiraExperienceAdvice`:
- `type`: `'SUCCESS'` | `'CORRECTION'` | `'HINT'` | `'ENCOURAGEMENT'` | `'NEXT_STEP'`
- `message`: Pedagogical guidance (never "Wrong answer", always constructive)
- `suggestedAction`: Concrete action the learner can take next

---

## 5. How Quest Connects

In `app/quest/page.tsx`, quests with interactive items resolve experiences dynamically:
```
Quest Item
  ↓
currentItem.experienceType
  ↓
experienceRegistry.getExperienceDefinition(experienceType)
  ↓
experienceDef.template -> Unified HUD & Badge
  ↓
Interactive Container -> ExperienceOrchestrator
  ↓
ExperienceResult -> LearnerModelAdapter -> Decision Engine
```

Standard multiple-choice quests do not specify an `experienceType` and render normally with zero overhead.

---

## 6. Experience #4: 3D Human Heart Anatomy Explorer (`HEART_ANATOMY_EXPLORER`)

Demonstrates the reusability of the Experience Engine for **biological anatomy and physiological processes** without creating domain engines like `HeartEngine` or `BiologyEngine`.

### Why it uses `ManipulationExperience` (`template: 'manipulation'`)
Anatomy exploration is fundamentally a spatial interaction:
1. The student rotates the 3D organ along yaw and pitch axes.
2. The student raycasts and selects individual structures (chambers, valves, great vessels).
3. The student isolates components and validates directional relationships.
4. It maps directly onto the `manipulation` archetype with domain-specific anatomy configuration and declarative validation rules.

### Configurable Domain Rules (`lib/experience/domain/heartAnatomyRules.ts`)
- **Structure Registry**: Declarative list of 12 focused anatomical entities (`right_atrium`, `left_ventricle`, `mitral_valve`, `aorta`, etc.) with category (`chamber` | `valve` | `vessel`), oxygenation status, clinical significance, and 3D coordinate centers.
- **Valve & Chamber Relationships**: Deterministic adjacency graph (e.g. Mitral valve connects Left Atrium to Left Ventricle; Tricuspid connects Right Atrium to Right Ventricle).
- **Blood-Flow Sequence**: Canonical 12-step pathway from `vena_cava` through pulmonary circuit to systemic `aorta`.
- **Misconception Detection**: Specifically detects AV valve confusion (swapping Mitral and Tricuspid) and chamber sidedness confusion (anatomical left vs observer right).
- **Contextual Challenge Engine**: Verifies functional comprehension through interactive, in-scene questions.

### Representation of Blood Flow
- Modeled as a deterministic, educational cardiovascular circuit rather than an unstable fluid dynamics solver.
- 120 animated particles trace the 12-step path in continuous dual-phase loops:
  - **Deoxygenated Flow** (Blue `#38bdf8`): Vena Cava → Right Atrium → Tricuspid Valve → Right Ventricle → Pulmonary Valve → Pulmonary Artery → Lungs.
  - **Oxygenated Flow** (Crimson `#ef4444`): Pulmonary Veins → Left Atrium → Mitral Valve → Left Ventricle → Aortic Valve → Aorta.
- Speed and trajectory dynamically adapt when the student activates Blood Flow Mode.

### How Xira Observes the Experience
Telemetry events (`structure_selected`, `flow_step_completed`, `challenge_answered`, etc.) are mapped to educational observations:
- `repeated_valve_confusion`: Student repeatedly interchanges mitral and tricuspid valves.
  - *Xira Guidance*: "Try tracing blood flow from atria into ventricles. The Tricuspid valve is on the Right side, while the Mitral valve is on the Left."
- `correct_flow_sequence`: Traced the full 12-step circulation path.
  - *Xira Guidance*: "Nice! You followed the path from the right side to the lungs and back to the left side."
- `flow_direction_error`: Reversed pulmonary or systemic flow directions.
- **Rule**: Xira never diagnoses psychological traits or medical conditions; all observations remain strictly pedagogical.

### How to Add Another Anatomy Experience (e.g. Inner Ear or Human Brain)
To add another anatomical structure (e.g. `BRAIN_LOBES_EXPLORER` or `EAR_COCHLEA_EXPLORER`):
1. **Do NOT create `EarEngine` or `BrainEngine`**.
2. Create a declarative config: `lib/experience/catalog/brainLobeConfig.ts` specifying structures (frontal, parietal, occipital, temporal), functions, and challenges.
3. Implement domain validation rules: `lib/experience/domain/brainLobeRules.ts`.
4. Wrap with `ExperienceDefinition` using `template: 'manipulation'`.
5. Register in `ExperienceRegistry.getInstance().register('BRAIN_LOBES_EXPLORER', BRAIN_LOBES_DEFINITION)`.
6. Plug into `ExperienceOrchestrator`—the orchestrator coordinates lifecycle, validation, telemetry, and Xira automatically.

---

## 7. Experience #5: Programming Code Lab (`CODE_DEBUGGING`)
**Theme**: “Debug by Doing”  
**Concept**: `python_debugging_basics`  
**Template**: `code` (`lib/experience/templates/codeExperience.ts`)  
**Dedicated Route**: `/experience/code`  
**Canonical Quest**: `/quest?concept=python_debugging_basics`  

Proves that the **Experience Engine is not fundamentally a 3D engine**—the exact same lifecycle, orchestrator, telemetry, Xira observation layer, and Bayesian learner model seamlessly coordinate code-based experiential learning.

### Educational Objective: Accumulation vs. Reassignment
The learner interacts with a classic Python beginner trap:
```python
numbers = [2, 4, 6, 8]
total = 0
for number in numbers:
    total = number  # Bug: reassigns instead of accumulating
print(total)
```
- **Initial Execution**: Outputs `8` (last element) instead of expected `20`.
- **Learner Discovery**: Learner modifies `total = number` to `total += number` or `total = total + number`.
- **Educational Resolution**: Learner directly sees the loop accumulate values into `20`.

### Security Boundary: Deterministic Constrained Execution
- **Zero Arbitrary Execution**: Absolutely **NO** `eval()`, `exec()`, `child_process`, `shell`, or server-side Python subprocesses are invoked.
- **Safety Guarantee**: The code lab uses a pure, deterministic parser/AST validator (`lib/experience/domain/codeDebuggingRules.ts`) that verifies:
  - Loop variable iteration (`for <var> in <list>:`)
  - Target accumulator accumulation (`total += number` or `total = total + number`) vs reassignment (`total = number`)
  - Rejection of hardcoded bypasses (e.g., `print(20)` without calculation is caught as `bypassed_loop`)
- Leaves a clean, pluggable contract for future sandboxed execution microservices while remaining 100% secure in-process.

### Telemetry & Xira Observations
1. **Canonical Telemetry Events**:
   - `code_experience_started`
   - `code_edited`
   - `code_run`
   - `output_observed`
   - `code_validation_failed`
   - `code_validation_passed`
   - `hint_requested`
   - `code_reset`
   - `code_submitted`
   - `code_experience_completed`
2. **Pedagogical Observations**:
   - `repeated_assignment_pattern`: Identifies repeated reassignment inside the loop.
   - `meaningful_code_correction`: Detects switch to accumulation operator before test run.
   - `successful_debugging`: Verifies output matches target via accumulator.
   - `independent_completion`: Flags solution reached without relying on hints.
3. **Progressive Hint Escalation**:
   - **Hint 1**: "Look at what happens to total every time the loop runs."
   - **Hint 2**: "Is total keeping the previous value, or replacing it?"
   - **Hint 3**: "The operator used here controls whether the value is accumulated or replaced."

### Evidence Model (`codeEvidence`)
Produces structured evidence for the Learner Model:
```typescript
interface CodeEvidence {
  runs: number;
  edits: number;
  outputAttempts: number;
  validationAttempts: number;
  hintsUsed: number;
  correctionCount: number;
  detectedBug?: string;
  correctionPattern?: string;
  independentCompletion: boolean;
  finalSuccess: boolean;
}
```

### Reusability for Future Programming Experiences
The `CodeExperience` template is fully generic. Future programming modules can be added simply by defining declarative configs:
- Off-by-one boundary conditions (`range(len(items))`)
- Function return vs print statement confusion
- Mutable default parameter traps
- Array pointer manipulation & recursion tracing
- JavaScript promise handling or SQL subqueries
**No `ProgrammingEngine` or custom orchestrator needed.**

