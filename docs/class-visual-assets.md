# Class visual asset inventory

Audit of every visual asset and component the Class can draw on. This was done before the Class visual rebuild. "Reuse" means the asset renders in the rebuilt Class.

Findings:
- **No GLB/glTF files exist in the repository.** The reference sheet's "Buddy – 3D Robot Teacher (GLB)" has no file behind it.
- Most PNGs in `public/images/classroom/` are small crops of one reference sheet (75–330 px), and the background is baked into them. Several pose crops are mis-cropped: they show sheet labels such as "Hinting Pose" and a different pose than their name says.

## Images (`public/`)

| Path | Type | Size / alpha | Purpose | Reusable? | Target in the rebuilt Class |
|---|---|---|---|---|---|
| `robot.png` (= `images/robot.png`) | PNG | 1024×1536, real transparency | App-wide Buddy robot, teacher pose with pointer | **Yes** | **Buddy** standing in the classroom (desktop stage + mobile strip) |
| `images/classroom/classroom-interior-clean.png` | PNG | 188×120, opaque | Empty futuristic classroom interior | Yes, only as a soft ambient layer (too small to be sharp) | Low-opacity room layer behind the CSS/SVG classroom |
| `images/classroom/classroom-interior.png`, `classroom-interior-grid.png` | PNG | 190×140 / 390×180 | Same interior, with sheet labels | No (labels baked in) | – |
| `images/classroom/classroom-master-reference.png` | PNG | 1024×576 | Flattened screenshot of the whole reference UI | **Never** as UI (reference only) | Design reference for composition |
| `images/classroom/buddy-teacher-clean.png`, `buddy-teacher-exact.png`, `buddy-pedestal-teaching.png`, `buddy-full-pedestal.png`, `buddy-teaching-pose.png` | PNG | ≤260×340, opaque | Reference Buddy on pedestal, room background baked in | No: low resolution, baked background, a black patch where the speech bubble was cut out | Pedestal design is rebuilt in CSS |
| `images/classroom/buddy-*.png`, `buddy-pose-*.png` (12 files) | PNG | 75–80 px | Pose crops | No: mis-cropped, 75 px | – |
| `images/classroom/buddy-idle*.png`, `buddy-head-closeup.png`, `buddy-poses-grid.png` | PNG | ≤330 px | Idle/pose sheet crops | No: baked background, too small | – |
| `images/classroom/smartboard-frame-clean.png`, `smartboard-complete.png` | PNG | 170×140 / 535×350 | Board frame / board with DC-motor content | No: too small; the "complete" version has DC-motor content baked in | Frame rebuilt in CSS |
| `images/classroom/dc-motor-*.png` | PNG | ≤300 px | DC motor artwork | Already used only as DC-motor-scoped optional artwork | Unchanged (identity-gated) |
| `images/learning-objects/*-exact.png` | PNG | small | DC-motor flashcard illustrations | DC-motor demo content only | Unchanged |
| `images/learning-objects/learning-objects-master-desk.jpg` | JPG | 1024×576 | Reference photo of physical cards | Reference only | Card styling reference |
| `blackboard.jpg` | JPG | 1672×941 | Green chalkboard texture (tutor page) | No (does not fit the futuristic room) | – |
| `generated-visuals/*` | PNG | – | Cached AI artwork (DC motor) | Optional artwork only | Unchanged |

## Components

| Path | Purpose | Reused / changed |
|---|---|---|
| `components/classroom/SmartBoard.tsx` | Teaching surface: title, summary, visual, key principle, Try This, check question, feedback, retry/reveal, navigation | Reused. Only the visual presentation changes: a monitor frame, stage accents, and a completion panel |
| `components/classroom/SmartBoardVisualRenderer.tsx` + `visuals/*` | Deterministic, identity-gated teaching visuals (physics, biology, chemistry, code, graph, timeline…) | Reused unchanged |
| `components/classroom/BuddyTeacherStage.tsx` | Buddy + speech bubble | Rebuilt: `robot.png` on a CSS pedestal, replacing the procedural 3D "drone ball" |
| `components/buddy/BuddyScene.tsx`, `BuddyModel.ts` | Procedural Three.js capsule drone | No longer rendered in the Class (still used by onboarding / other pages) |
| `components/buddy/BuddyState.ts` | Buddy moods, labels, colours | Reused (mood → pose, glow, label) |
| `components/classroom/ClassroomXiraAssistant.tsx` | Xira observation, Ask Xira, quick prompts | Reused, restyled as a compact contextual panel / sheet |
| `components/classroom/ClassroomToolbar.tsx` | Bottom learning dock | Reused, restyled; progress kept |
| `components/classroom/tools/ClassroomToolsModal.tsx` | Lesson steps, questions, audio, hints, notes, formula cards, flashcards, sources | Reused. Notes / Formula / Flashcards now open here instead of downloading straight away; download stays available inside the tool |
| `components/learning-objects/LearningFlashcard.tsx` | Physical flip card (front/back, known/review) | Reused in the Flashcards tool |
| `components/learning-objects/FormulaCard.tsx`, `KaTeXRenderer.tsx` | Formula card with variables | Reused in the Formula tool |
| `components/learning-objects/StickyNote.tsx` | Sticky note object | Reused for hints and common mistakes |
| `components/ui/Drawer.tsx` | Bottom/right sheet | Reused, with a classroom colour tone option |
| `lib/learningObjectsDownloads.ts` | PNG card downloads | Reused from inside the tools |
| `components/ui/ClassStageIndicator.tsx` | Stage stepper | Not used by the Class (its stage keys differ from `classStage.ts`) |
