---
name: blend-mode-chrome
description: Keep fixed nav and overlay chrome legible over any background brightness using mix-blend-mode:difference, with no scrim. Use when UI sits over a constantly-changing 3D scene in an immersive/cinematic web design.
---

# Blend-Mode Chrome

**Use when** fixed chrome — a top nav, a side gauge, a corner HUD — floats over a WebGL scene that shifts from near-black to bright dawn, and a translucent scrim would muddy the cinematics.

## Technique
`mix-blend-mode: difference` subtracts the element's color from whatever pixels sit behind it. Over a dark background, near-white chrome stays near-white; over a bright background, the same chrome inverts toward dark. The result is automatic contrast that tracks the scene frame-by-frame, so a single nav stays readable across the whole midnight→sunrise cycle with zero JS and no backing plate.

Apply the blend mode on the fixed *container* (`.chrome`, `.depth`, `.clock`) so the whole instrument inverts as a unit. Keep these elements light-on-transparent — `difference` works best with high-value foreground colors against varied backgrounds.

Reserve a high `z-index` for chrome and keep the 3D canvas at `z-index: 0`. Note the order: a multiply-blended vignette can live at `z-index: 1` for mood, while difference-blended chrome sits at `z-index: 20` above it.

## Pattern
```css
.chrome {
  position: fixed; top: 0; left: 0; right: 0;
  z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: 26px clamp(20px, 5vw, 64px);
  mix-blend-mode: difference;   /* auto-inverts over any brightness */
}
/* same trick for the side gauge and corner clock */
.depth, .clock { position: fixed; z-index: 20; mix-blend-mode: difference; }

/* the canvas underneath; vignette mood layer between canvas and chrome */
#world { position: fixed; inset: 0; z-index: 0; }
body::after {            /* vignette */
  content: ''; position: fixed; inset: 0; z-index: 1;
  pointer-events: none; mix-blend-mode: multiply;
  background: radial-gradient(120% 90% at 50% 35%, transparent 40%, rgba(6,3,14,.55) 100%);
}
```

## Pitfalls
- A solid (non-transparent) background on the chrome blends as a block and turns garish — keep backgrounds transparent; only borders/text should be opaque.
- `difference` against a mid-gray background yields low contrast (gray minus gray ≈ gray); design the scene to avoid flat 50% gray behind critical chrome.
- `mix-blend-mode` blends against everything painted below in the *same* stacking context — a stray opaque ancestor will break the inversion; keep chrome's ancestors transparent.
- Buttons inheriting `difference` invert on hover too; give interactive fills (`.chrome__cta:hover`) explicit colors and test both states.
- Brand-colored logos look wrong inverted — accept that difference chrome reads as light/dark, not brand hue, or exempt the logo from the blend.
- Some mobile browsers throttle blend modes over large canvases; verify performance and provide a scrim fallback if needed.
