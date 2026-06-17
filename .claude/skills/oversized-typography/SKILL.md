---
name: oversized-typography
description: Render massive kinetic display type that scales fluidly with clamp() and never clips against a 3D background. Use when building oversized headlines for an immersive/cinematic web design.
---

# Oversized Kinetic Typography

**Use when** a cinematic landing page needs giant display words layered over a live WebGL scene, and they must stay legible and uncut from phones to ultrawide monitors.

## Technique
Pair a tight display face (Syne 700/800) with a calm body face (Space Grotesk 300/400). Display type carries the emotion; body text stays quiet so the 3D world reads through it. Load only the weights you use to keep first paint fast.

Scale every size with `clamp(min, fluid-vw, max)`. The `vw` middle term breathes with the viewport while the `max` caps growth so a hero word can't overrun the stage on a 32" screen. Crush `line-height` toward 0.9 and pull `letter-spacing` negative so multi-line display blocks feel like one sculpted mass.

For gradient words, paint a `linear-gradient` and clip it to the glyphs with `background-clip: text` + transparent color. Animate `background-position` for a slow shimmer.

The real bug here: long single words (e.g. `TO FIRST LIGHT.`) overflowed and clipped on wide screens because the hero `panel__inner` was capped at 640px while the type scaled past it. Fix is two-part — widen the hero container AND add `overflow-wrap: break-word` to every display class.

## Pattern
```css
.display {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.025em;
  font-size: clamp(2.4rem, 7.6vw, 7rem);
  text-transform: uppercase;
  overflow-wrap: break-word; /* giant words wrap instead of clipping */
}
.display span { display: block; } /* one word per line, stacked */

/* gradient clipped to the glyphs */
.display--accent {
  background: linear-gradient(100deg, var(--accent), var(--glow) 55%, var(--accent2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* the overflow fix: hero + finale need the full stage, not the 640px body cap */
.panel__inner { max-width: 640px; }
.panel[data-panel='0'] .panel__inner,
.panel[data-panel='4'] .panel__inner { max-width: min(1180px, 94vw); }
```

## Pitfalls
- A narrow `max-width` on the text wrapper clips clamp-scaled words long before the viewport edge — widen the container for hero/finale panels, don't just shrink the font.
- Omitting `overflow-wrap: break-word` lets an unbreakable word push horizontal scroll; pair it with `overflow-x: hidden` on `body`.
- `background-clip: text` needs the `-webkit-` prefix first and `color: transparent`; forget either and the gradient vanishes or the text turns invisible.
- A bright gradient fill can drop below contrast minimums over a light dawn sky — keep one solid-ink display variant for busy backgrounds.
- Loading every Syne/Space Grotesk weight bloats the font request; request only `600;700;800` and `300;400;500`.
- `line-height: 0.9` makes descenders and accents collide across stacked lines — test real copy, not lorem.
