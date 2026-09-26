# Xpedition Class integrations

This document defines the Class-only integration boundary. The existing Xpedition Class UI remains the source of truth and external tools are optional capabilities behind adapters.

## Visual contract

The existing `components/classroom/ClassroomLayout.tsx` remains the visual source of truth. This integration pass intentionally does not redesign the Class shell, Smart Board, Buddy area, Xira area, or learning-tools dock.

## Provider roles

### OpenMAIC
OpenMAIC is the primary external teaching-runtime boundary. Its current project publishes the `@openmaic/*` SDK family, including DSL, renderer, generation, storage, importer and editor packages. Xpedition does not hard-depend on those packages in this repository because the current Xpedition app must continue to run without the external runtime. A separately hosted bridge can be configured with `XPEDITION_OPENMAIC_BRIDGE_URL`.

The bridge contract used by this adapter is intentionally an Xpedition-owned boundary:

- `POST {bridge}/scene`
- `POST {bridge}/action`

The bridge is not claimed to be an OpenMAIC public API. It is an integration seam for a separately hosted OpenMAIC runtime.

### LiveGenie
LiveGenie's public product describes real-time multimodal tutoring with visuals, assessments, games and interactives. This repository does not assume undocumented LiveGenie API routes. The provider remains inactive until an official API/SDK integration contract is available.

### Canvas
Canvas AI Experiences and AI Conversations are integrated through the documented Canvas REST API. Credentials remain server-side. Configure:

- `CANVAS_BASE_URL`
- `CANVAS_API_TOKEN`
- `CANVAS_COURSE_ID`
- `CANVAS_AI_EXPERIENCE_ID`

### Miro
Miro can be used as an optional collaborative workspace. The current provider returns a configured Live Embed/workspace URL through `NEXT_PUBLIC_MIRO_EMBED_URL`; the Xpedition Class shell remains unchanged.

## Runtime rule

External integrations never replace the Xpedition Class UI. If an external provider is unavailable, the existing Xpedition deterministic classroom runtime remains the fallback.

## Status endpoint

`GET /api/classroom/integrations` returns non-secret provider readiness metadata.
