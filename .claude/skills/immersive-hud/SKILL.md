---
name: immersive-hud
description: Build diegetic UI overlays — a vertical scroll depth gauge and a time-of-day clock that read out the scene's own state. Use when an immersive/cinematic 3D page needs HUD chrome that feels native to the world instead of bolted-on UI.
---

# Immersive HUD

**Use when** you want fixed overlays that look like instruments aboard the experience — a depth gauge tracking scroll, a clock tracking the world's day cycle — rather than a generic progress bar.

## Technique
A diegetic HUD reads out the same state the 3D scene consumes. Here scroll progress drives a smoothed `day` factor `[0,1]`; the world lights itself from `day`, and the HUD translates that *same* number into human readouts. Because both consume one source, the instruments never disagree with the picture.

The depth gauge is a thin vertical track pinned to the right edge with a fill whose `height` is the eased progress. The clock maps `day` onto a real time span (23:45 → 06:05) and onto a phase/icon pair so the words and glyph change as the sky does.

Position everything `position: fixed`, give it a high `z-index`, and set `mix-blend-mode: difference` so the chrome inverts against whatever brightness sits behind it — legible over both the black midnight and the bright dawn without a scrim. Use `font-feature-settings: 'tnum'` so the ticking clock digits don't jitter.

## Pattern
```js
// map the world's day factor [0,1] → a clock reading + phase + icon
function updateClock(day) {
  const startMin = 23 * 60 + 45            // 23:45 (midnight start)
  const endMin = 6 * 60 + 5               // 06:05 (next morning)
  const span = 24 * 60 - startMin + endMin
  const mins = (startMin + day * span) % (24 * 60)
  const hh = String(Math.floor(mins / 60)).padStart(2, '0')
  const mm = String(Math.floor(mins % 60)).padStart(2, '0')
  clockTime.textContent = `${hh}:${mm}`

  let phase, icon
  if (day < 0.18) [phase, icon] = ['Moonrise', '☾']
  else if (day < 0.45) [phase, icon] = ['Deep night', '☽']
  else if (day < 0.7) [phase, icon] = ['Pre-dawn', '✦']
  else if (day < 0.9) [phase, icon] = ['Daybreak', '☼']
  else [phase, icon] = ['Sunrise', '☀']
  clockPhase.textContent = phase
  clockIcon.textContent = icon
}

// in the render loop — gauge + clock share the eased progress / day
depthFill.style.height = (progress * 100).toFixed(1) + '%'
updateClock(day)
```
```css
.clock { position: fixed; left: clamp(20px,5vw,64px); bottom: 28px;
  z-index: 20; mix-blend-mode: difference; font-feature-settings: 'tnum'; }
.depth__track span { width: 100%; height: 0%; /* JS sets height */
  background: linear-gradient(180deg, var(--accent2), var(--glow), var(--accent)); }
```

## Pitfalls
- Driving the HUD off raw `targetProgress` instead of the eased `progress`/`day` makes readouts jitter ahead of the smoothed camera — read the same eased value the scene uses.
- Updating `textContent` every frame is cheap, but recomputing layout via inline styles on many nodes is not; touch only `height` and the few clock spans.
- Without `tnum`, proportional digits shift width as the clock ticks and the HUD visibly wobbles.
- Forgetting `mix-blend-mode: difference` forces you to add a scrim that fights the cinematic look; let the blend mode handle contrast.
- Phase thresholds must line up with the lighting transitions in the render loop, or the clock says "Sunrise" while the sky is still dark.
- The gauge/clock must hide or reflow on small screens — pin them with `clamp()` and drop the vertical gauge under ~720px.
