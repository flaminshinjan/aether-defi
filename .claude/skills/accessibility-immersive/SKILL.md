---
name: accessibility-immersive
description: Make a heavy WebGL scroll experience usable — honor prefers-reduced-motion, keep keyboard/nav fallbacks, guarantee text contrast over busy 3D, and ship a poster fallback when WebGL is unavailable. Use when hardening an immersive/cinematic web design for real users.
---

# Accessibility for Immersive Scenes

**Use when** a cinematic 3D page must remain usable for people who get motion-sick, navigate by keyboard, or land on a device with no WebGL — without gutting the experience for everyone else.

## Technique
Honor `prefers-reduced-motion: reduce`. Kill decorative loops (shimmer, the scroll-cue wheel) in CSS, and in JS hold the journey at low/zero scrub easing or jump straight to a station instead of flying the camera. The content arc stays; the vestibular triggers go.

Keep navigation real. The nav and "return to origin" use `data-go` indices and `window.scrollTo` — so the page is still a normal scrollable document, focusable and operable without the 3D layer. Make nav items real `<button>`/`<a>` elements (not just styled spans) so they're keyboard-reachable, and `e.preventDefault()` only after handling the jump.

Guard text contrast over the moving scene. The vignette darkens the frame, `mix-blend-mode: difference` keeps chrome legible, and body copy uses high-value ink (`--ink: #f4eefe`) — but a bright dawn sky can still wash out a gradient headline, so keep a solid-ink fallback for body-critical text.

Detect WebGL and swap in a static poster + the full text content if it's missing, so the page never renders to a blank canvas.

## Pattern
```css
@media (prefers-reduced-motion: reduce) {
  .scroll-cue span::after,
  .loader__mark { animation: none; }   /* drop decorative motion loops */
}
```
```js
// reduced-motion: keep the story, drop the camera flight
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
function scrollToStation(index) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  const top = journey.progressForStation(index) * maxScroll
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
}

// WebGL fallback: never leave a blank canvas
function hasWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2') }
  catch { return false }
}
if (!hasWebGL()) {
  document.getElementById('world').replaceWith(
    Object.assign(new Image(), { src: '/poster.jpg', className: 'poster' })
  )
  document.getElementById('loader')?.classList.add('is-done')
} else {
  boot()
}
```

## Pitfalls
- `prefers-reduced-motion` should reduce camera/scrub motion in JS too, not just CSS animations — a scrubbed fly-through is the worst offender for motion sickness.
- Styled `<span>` nav items aren't keyboard-focusable; use real buttons/links with `data-go` so jumps work without a mouse.
- A gradient `background-clip: text` headline can fall below contrast over the bright dawn frame — keep solid-ink fallbacks for anything load-bearing.
- If `hasWebGL()` fails you must also clear the loader veil, or reduced-capability users stare at the boot screen forever.
- `behavior: 'smooth'` ignores reduced-motion on its own — branch to `'auto'` explicitly.
- Don't trap focus behind the fixed `z-index: 100` loader; release pointer events (via `visibility: hidden`) once it fades, and ensure content stays reachable underneath.
