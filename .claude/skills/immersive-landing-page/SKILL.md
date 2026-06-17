---
name: immersive-landing-page
description: Orchestrate a full surreal, cinematic, scroll-as-travel WebGL landing page from scratch — a world you journey through instead of a dashboard you read. Use when the request is to build an entire immersive 3D site (like AETHER), not just one effect; it routes to the focused sub-skills in the right order.
---

# Immersive Landing Page (orchestrator)

**Use when** someone asks for a whole "fantasy world you can interact with" — a massive interactive 3D environment, scroll-driven journey, oversized type, living creatures — rather than a single isolated effect. This skill is the playbook; it delegates the details to ~28 focused sibling skills in `.claude/skills/`.

## The four knobs to lock first

Before touching code, pin these with the user (or pick strong defaults). They cascade into every later decision:

1. **Domain + anti-pattern** — the hook: "a {domain} platform instead of {boring default}". (AETHER: DeFi, instead of dashboards.)
2. **World + visual reference** — what the 3D scene looks like. (Stylized mountains, digital-painting palette.)
3. **Mood arc** — an emotional/color *direction*, not just colors. (Moonlit midnight → golden sunrise.) This single factor drives lighting, fog, exposure, sky and particles together.
4. **Stations → product mapping** — map each feature to a *place or natural phenomenon*. (Liquidity = glowing river, yield = mountain ascent.) See `environmental-storytelling`.

## Build order (each step → a sub-skill)

Work outside-in: get a lit scene on screen, then a moving camera, then the world, then life, then chrome, then polish.

1. **Scaffold & scene** — Vite + Three.js + GSAP. → `webgl-scene-setup`
2. **Camera journey** — spline + scroll mapping + easing first, so you can fly through the empty stage. → `scroll-camera-journey`, `smooth-camera-easing`, `mouse-parallax`
3. **The world** — terrain, sky, water, islands. → `procedural-terrain`, `gradient-sky-shader`, `flowing-water-shader`, `floating-islands`, `low-poly-stylization`
4. **Atmosphere** — particles, clouds, fog depth. → `particle-systems`, `volumetric-clouds`, `atmospheric-fog-depth`
5. **Life** — creatures, flocks, idle motion so nothing is frozen. → `animated-creatures`, `flocking-boids`, `idle-ambient-motion`
6. **Mood system** — wire the arc factor through everything; add grade + bloom. → `day-night-cycle`, `cinematic-color-grading`, `bloom-postprocessing`
7. **Narrative & chrome** — overlay panels, oversized type, diegetic HUD. → `scroll-narrative-panels`, `section-as-experience`, `oversized-typography`, `immersive-hud`, `blend-mode-chrome`, `loader-reveal`
8. **Harden** — perf, responsive, a11y, then run it locally. → `webgl-performance`, `responsive-webgl`, `accessibility-immersive`

## Pattern (project skeleton)

```
index.html            # fixed canvas + overlay UI: nav, HUD, scroll panels, loader
src/
  main.js             # renderer, lights, mood-factor wiring, scroll→camera, tick loop
  journey.js          # camera spline + per-station mood curve
  style.css           # oversized type + cinematic overlay
  world/{sky,terrain,river,atmosphere,creatures,islands}.js
```
Each `world/*` module returns a `THREE.Group` exposing `group.userData.update(t)`; `main.js` calls them every frame and drives the mood factor into `day-night-cycle`.

## Pitfalls

- **Build the camera path before the art.** Flying through an empty scene exposes pacing problems early; decorating first wastes time on frames nobody sees.
- **One mood factor, not scattered tweaks.** Route night→dawn through a single `[0,1]` value or the scene desyncs (warm light under a night sky).
- **Emotion first, product second.** If a station reads as a feature card with a 3D background, you've missed it — make the *world* carry the meaning.
- **Don't over-bloom or over-fog.** Both read as "broken/washed out" past a threshold; tune against the brightest and darkest stations.
- **Always finish by running it locally** (`npm run dev`) and scrubbing the whole scroll — bugs live in the transitions between stations, not the stations.
