---
name: section-as-experience
description: Replace feature sections with full-viewport visual stations, structured as data-panel scroll markers with alternating left/center/right composition and emotion-first hierarchy. Use when designing immersive/cinematic scroll pages instead of a card grid.
---

# Section as Experience

**Use when** a page should unfold as a sequence of full-screen "stations" the user travels through, each a moment in a 3D world, rather than stacked feature blocks.

## Technique
Every section is `min-height: 100vh` so it owns the full stage and the 3D world behind it can resolve to one composed shot per panel. Tag each with `data-panel="N"` — that index is the contract between DOM and scene: nav jumps target it, scroll progress maps to it, and the journey camera knows which station it's framing.

Alternate composition to give the scroll rhythm and to dodge the focal point of the 3D scene. Center the hero and finale (`panel__center`), push the liquidity valley text left (`panel__left`), pull the yield ascent right (`panel__right`, right-aligned). The empty side of each panel is where the world performs.

Order content emotion-first: eyebrow (place/phase) → oversized headline (the feeling) → quiet body (the explanation) → stats (the proof). Reveal each panel's inner block with a blur-up as it enters, and reverse it on exit so re-scrolling feels alive.

## Pattern
```html
<main id="scroll">
  <section class="panel" data-panel="0"><div class="panel__inner panel__center">…</div></section>
  <section class="panel" data-panel="1"><div class="panel__inner panel__left">…</div></section>
  <section class="panel" data-panel="2"><div class="panel__inner panel__right">…</div></section>
  <section class="panel" data-panel="3"><div class="panel__inner panel__center">…</div></section>
</main>
```
```css
.panel { min-height: 100vh; display: flex; align-items: center;
  padding: 0 clamp(22px, 7vw, 120px); position: relative; }
.panel__inner { max-width: 640px; will-change: transform, opacity; }
.panel__center { margin: 0 auto; text-align: center; }
.panel__left   { margin-right: auto; }
.panel__right  { margin-left: auto; text-align: right; }
```
```js
// blur-up reveal per panel, reversible on exit
gsap.utils.toArray('.panel').forEach((panel) => {
  gsap.from(panel.querySelector('.panel__inner'), {
    scrollTrigger: { trigger: panel, start: 'top 70%', end: 'bottom 30%',
      toggleActions: 'play reverse play reverse' },
    y: 60, opacity: 0, filter: 'blur(12px)', duration: 1.1, ease: 'power3.out',
  })
})
```

## Pitfalls
- Sections shorter than `100vh` break the one-shot-per-station illusion and desync the camera mapping — keep the full viewport.
- The `data-panel` index must stay aligned with the journey's station list; reorder DOM and scene together or nav jumps land on the wrong scene.
- Always centering composition stacks every shot over the scene's focal point and hides the world — alternate left/center/right.
- `will-change: transform, opacity` on the animated inner block matters; omit it and the blur-up reveal can jank on entry.
- Right-aligned panels (`panel__right`) must flip back to left-aligned on mobile or text runs off the edge.
- `toggleActions` without the reverse pair leaves panels frozen-in after first view, killing the sense of a living journey on scroll-back.
