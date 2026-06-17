---
name: cinematic-color-grading
description: Design 3-stop gradient palettes with warm/cool key+fill lighting, apply ACES tone mapping and exposure, and finish with a CSS vignette + grain overlay via body::after and mix-blend-mode. Use when an immersive WebGL/Three.js scene needs a film-graded mood.
---

# Cinematic Color Grading

**Use when** an immersive scene looks technically correct but flat, and you want it to read like a graded film frame — cohesive palette, directional warm/cool light, vignette and grain.

## Technique
Design palettes as 3-stop gradients (top / mid / horizon) per mood, exactly like the sky shader's night and dawn triplets. Keep one cool axis and one warm axis: a cool key (moon-blue) with a slightly warmer fill at night, flipping to a warm key (sunrise gold) with a cool fill at dawn. Opposing key/fill temperatures is the classic cinematic lighting move — it gives form and separation.

Grade in two layers. The renderer-side grade is `ACESFilmicToneMapping` plus an animated `toneMappingExposure` — ACES rolls off highlights filmically so emissive glows bloom into white instead of clipping harshly. The page-side grade is a CSS overlay drawn on top of the canvas.

A `body::after` pseudo-element with a radial-gradient vignette darkens the corners and focuses the eye; layer a tileable noise PNG (or SVG turbulence) at low opacity with `mix-blend-mode: overlay` for filmic grain. `pointer-events: none` keeps the overlay non-interactive. This costs nothing on the GPU's 3D budget and unifies the frame.

## Pattern
```css
/* CSS finishing pass over the WebGL canvas */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  /* vignette: bright center, darkened corners */
  background:
    radial-gradient(120% 120% at 50% 38%, transparent 55%, rgba(5,6,15,0.55) 100%),
    url('/noise.png');
  background-size: cover, 180px 180px;
  mix-blend-mode: overlay;
  opacity: 0.85;
}
```
```js
// renderer-side grade, animated across the cycle
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = THREE.MathUtils.lerp(1.02, 1.3, day)

// warm/cool key + fill, flipping temperature with time of day
key.color.lerpColors(new THREE.Color('#bcd2ff'), new THREE.Color('#ffce8f'), day)
fill.color.set('#6f9bff')              // cool fill opposes the key
fill.intensity = THREE.MathUtils.lerp(0.35, 0.12, day)
```

## Pitfalls
- `mix-blend-mode: overlay` on `body::after` only blends against the page background, not the canvas, unless the canvas is a sibling behind it — keep the canvas at a lower `z-index` and the body background transparent.
- Grain at full opacity looks like TV static; keep it subtle (`opacity ≈ 0.05–0.15` for the noise layer specifically).
- Cranking exposure to "fix" a dark scene clips highlights — adjust palette and light intensity first, exposure last.
- Matching key and fill to the same color kills the depth that opposing temperatures create.
- Forgetting `pointer-events: none` on the overlay swallows clicks and scroll on the scene below.
