# Xpedition — Visual Intelligence Engine (Phase D3)

## 1. Architectural Overview

The **Visual Intelligence Engine** (`lib/visualIntelligence/`) is Xpedition's pedagogical reasoning layer for visual representations. Its objective is not merely "generating an image," but evaluating whether a visual representation genuinely advances learner comprehension, selecting the optimal modality, deriving grounded content constraints, checking existing asset caches, and structuring a validated generation plan for Phase 2.

```
                    LEARNING CONCEPT (+ Context & Stage)
                                      ↓
                         [VisualNeedEvaluator]
                                      ↓
                 ┌────────────────────┴────────────────────┐
                 ↓                                         ↓
           Visual Needed?                             No Visual
                 ↓                               (Returns false with
        [VisualTypeResolver]                       transparent reason)
                 ↓
     [Derive Pedagogical Purpose
      & Content Requirements]
                 ↓
       [VisualAssetResolver]
                 ↓
      ┌──────────┴──────────┐
      ↓                     ↓
Existing Asset?          No Asset
   ├── YES: Reuse           ↓
   │                  [PromptPlanner]
   │                        ↓
   │               [VisualGenerationEngine] (Phase 2)
   │                        ↓
   │                   Output Asset
   └───┬────────────────────┘
       ↓
[SmartBoardVisualPayload]
       ↓
  Smart Board
```

---

## 2. Core Subsystems

### A. Visual Need Evaluator (`VisualNeedEvaluator.ts`)
Determines whether a learning concept benefits from visual representation or would produce cognitive clutter:
- **Heuristic Evaluation**: Identifies spatial relationships, physical mechanisms, coordinate systems, 3D anatomical structures, vectors, and chemical bonds (`needed: true`, high confidence 0.80 - 0.96).
- **Cognitive Hygiene**: Suppresses unnecessary visuals for pure vocabulary definitions, verbal trivia, and simple grammatical rules (`needed: false`, reason clearly stated).
- **Confidence Bounding**: Returns deterministic decision confidence within `[0.0, 1.0]`.

### B. Visual Type Resolver (`VisualTypeResolver.ts`)
Selects the appropriate representation from Xpedition's multi-modal learning modalities:
- `educational_illustration`: High-clarity 2D generated concept illustration.
- `scientific_diagram`: Structured schematic with component annotations and vector directions.
- `interactive_simulation`: Deterministic physics/kinematics interactive canvas.
- `graph`: Coordinate plots, parabolic curves, distributions.
- `timeline`: Sequential chronological layout.
- `map`: Geographic and territorial layout.
- `anatomical_visual`: Biological organs, tissue layers, and circulatory pathways.
- `molecular_visual`: 3D ball-and-stick covalent/ionic bonding structures.
- `code_visual`: Execution trace, active stack frame, and pointer visualization.
- `3d_model`: Interactive spatial WebGL manipulation.
- `formula_visual`: Formatted mathematical derivation and variable focus.
- `comparison_visual`: Side-by-side contrast (e.g. Mitosis vs Meiosis).

### C. Accuracy Levels & Representation Priority Hierarchy
Every visual requirement declares an accuracy level (`decorative`, `contextual`, `conceptual`, `scientific`, `mathematical`, `technical`).

**Priority Hierarchy**:
1. Deterministic interactive simulation
2. Deterministic SVG/canvas diagram / coordinate graph
3. Verified existing asset (Phase 2 AssetStore)
4. Structured 3D asset (Three.js / WebGL)
5. Generated educational illustration (ComfyUI SD 1.5)
6. Decorative generated image

*Mathematical and scientific concepts strictly demand deterministic or verified schematic visuals, never uncontrolled artistic hallucinations.*

### D. Subject-Aware Rules (`rules/SubjectVisualRules.ts`)
Contains grounded pedagogical mappings across subjects:
- **Mathematics**: Geometry -> diagrams; coordinate algebra & calculus -> graphs; formulas -> formula visual.
- **Physics**: Kinematics -> simulations; electromagnetism & motors -> technical schematics; circuits -> schematics; optics -> ray diagrams.
- **Chemistry**: Bonding -> molecular visuals; reactions -> energy graphs; atomic structure -> schematics.
- **Biology**: Anatomy -> anatomical visuals; cellular pathways -> illustrations; genetics -> comparison visuals.
- **History**: Chronology -> timelines; territorial campaigns -> maps; cultural eras -> contextual illustrations.
- **Computer Science**: Algorithms -> code visuals / flow animations; data structures -> node diagrams.
- **Data Science**: Datasets & regression -> scatter plots and decision boundaries.

### E. Stage-Aware Rules (`rules/StageVisualRules.ts`)
Adapts visual requirements dynamically according to the student's lesson stage:
- `introduce`: Simplified conceptual overview; non-interactive.
- `explain`: Comprehensive mechanistic diagram; explicit force vectors and component labels.
- `demonstrate`: Step-by-step procedural progression.
- `interact`: Interactive simulation or parameter sliders enabled.
- `question`: Simplified visual isolating queried elements for diagnostic check.
- `practice`: Scaffolded visual with contextual hints.
- `challenge`: Edge-case anomaly or inverted polarity scenario.
- `assess`: Unassisted evaluation visual.
- `feedback`: Remedial highlight of misunderstood vector interactions.

### F. Visual Asset Resolver (`VisualAssetResolver.ts`)
Queries the Phase 2 `AssetStore` and `assets-manifest.json` before initiating generation. If an existing ready asset matches the concept and modality, it is reused immediately with zero diffusion latency.

### G. Prompt Planner (`PromptPlanner.ts`)
When a fresh visual must be generated:
- Translates structured requirements into safe Phase 2 `VisualGenerationRequest` objects.
- Focuses on educational intent rather than generic aesthetics.
- Standardizes anti-hallucination negative prompts (`blurry, distorted, low quality, photorealistic photograph, messy, illegible text, dark shadows, cartoon caricature`).
- Validates completeness against verified facts in `CANONICAL_CLASSROOM_LESSONS`. If verified facts are absent, flags `isIncomplete: true` rather than inventing facts.

---

## 3. Grounded Examples

### 1. DC Electric Motor
- **Visual Needed**: `true` (Confidence: 0.94)
- **Visual Type**: `scientific_diagram` (promoted to `interactive_simulation` during `interact` stage)
- **Accuracy Level**: `technical`
- **Pedagogical Purpose**: Demonstrate the vector interaction between stator magnetic field lines ($N \to S$), loop current, and the resulting Lorentz force couple producing rotational torque ($\tau = 2 F r$), emphasizing commutator switching every $180^\circ$.
- **Content Requirements**: Permanent stator magnets, armature coil, split-ring commutator, carbon brushes, central axle.

### 2. Projectile Motion
- **Visual Needed**: `true` (Confidence: 0.95)
- **Visual Type**: `interactive_simulation` (adjusts to `scientific_diagram` during `introduce` stage)
- **Accuracy Level**: `scientific`
- **Pedagogical Purpose**: Decouple constant horizontal velocity ($v_x = v_0 \cos\theta$) from downward gravitational acceleration ($a_y = -9.8\text{ m/s}^2$).
- **Content Requirements**: Launch point, launch angle $\theta$, parabolic flight trajectory, apex, impact point, velocity vector arrows.

### 3. Quadratic Function
- **Visual Needed**: `true` (Confidence: 0.88)
- **Visual Type**: `graph`
- **Accuracy Level**: `mathematical` (Priority Tier 2)
- **Pedagogical Purpose**: Visualize parabola curvature ($y = ax^2 + bx + c$), vertex extrema $(-b/2a)$, roots / x-intercepts, and axis of symmetry.
- **Content Requirements**: Cartesian axes ($x, y$), parabola curve, vertex point, root coordinates, grid lines.

### 4. Human Heart Anatomy
- **Visual Needed**: `true` (Confidence: 0.92)
- **Visual Type**: `anatomical_visual`
- **Accuracy Level**: `scientific`
- **Pedagogical Purpose**: Trace dual-circuit pulmonary and systemic blood flow through all four cardiac chambers, highlighting the $\approx 3\times$ thicker myocardium of the Left Ventricle compared to the Right Ventricle.
- **Content Requirements**: Right Atrium, Right Ventricle, Pulmonary Artery, Pulmonary Veins, Left Atrium, Left Ventricle, Mitral Valve, Aorta.

### 5. Historical Event (French Revolution)
- **Visual Needed**: `true` (Confidence: 0.76)
- **Visual Type**: `timeline` (or `map` for territorial campaigns)
- **Accuracy Level**: `contextual`
- **Pedagogical Purpose**: Sequence the causal progression from the Estates-General (1789) through the Storming of the Bastille to the Declaration of the Rights of Man.
- **Content Requirements**: Chronological timeline bar, date markers, milestone event nodes, brief causal annotations.

### 6. Programming Algorithm (Binary Search)
- **Visual Needed**: `true` (Confidence: 0.85)
- **Visual Type**: `code_visual`
- **Accuracy Level**: `technical`
- **Pedagogical Purpose**: Highlight active search window boundaries (`low`, `high`, `mid`), array element comparison, and halving of the search space.
- **Content Requirements**: Sorted array cells, index markers (`low`, `mid`, `high`), target comparison conditional, active sub-array highlight.

---

## 4. API Endpoints

### `POST /api/visual-intelligence`
- **Authentication**: Strict server-side authentication via `requireServerAuth(request)`.
- **Request Body**:
  ```json
  {
    "conceptId": "dc_motor",
    "subject": "Physics",
    "stage": "explain",
    "allowGeneration": false
  }
  ```
- **Response**: Sanitized `VisualRequirement` and `SmartBoardVisualPayload` without exposing server filesystem paths or ComfyUI transport details.
