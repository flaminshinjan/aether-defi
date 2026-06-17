---
name: loader-reveal
description: Hide a heavy WebGL scene behind a boot veil, precompile shaders with renderer.compile, fill an animated progress bar, then fade out and refresh ScrollTrigger. Use when an immersive/cinematic 3D page must reveal cleanly without a shader-compile stutter.
---

# Loader Reveal

**Use when** a Three.js scene needs a beat to compile shaders and warm the GPU, and you want the page to fade into a finished world rather than pop in mid-stutter.

## Technique
Cover everything with a full-viewport veil at the top of the stack (`z-index: 100`). Behind it, call `renderer.compile(scene, camera)` to force shader and material compilation up front — this is the expensive frame that would otherwise hitch on first scroll. Doing it under the veil hides the hitch entirely.

Drive a progress fill with an interval that advances in irregular increments so it feels like real work, not a fixed timer. When it reaches 100%, wait a short beat, then add an `is-done` class that transitions `opacity` and `visibility` together — visibility delays its toggle until the fade finishes so the veil stops capturing pointer events only after it's invisible.

Crucially, call `ScrollTrigger.refresh()` at reveal. The page measured its scroll geometry while the loader may have altered layout; refreshing recomputes every trigger's start/end so the journey maps correctly from the first scroll.

## Pattern
```js
function boot() {
  const loader = document.getElementById('loader')
  const loaderFill = document.getElementById('loader-fill')

  renderer.compile(scene, camera)   // precompile shaders behind the veil

  let p = 0
  const iv = setInterval(() => {
    p = Math.min(100, p + 6 + Math.random() * 12)  // irregular = feels real
    loaderFill.style.width = p + '%'
    if (p >= 100) {
      clearInterval(iv)
      setTimeout(() => {
        loader.classList.add('is-done') // fade out
        ScrollTrigger.refresh()         // re-measure triggers post-reveal
      }, 350)
    }
  }, 90)

  tick()   // start the render loop
}
boot()
```
```css
.loader { position: fixed; inset: 0; z-index: 100; background: var(--bg);
  transition: opacity 1.1s ease, visibility 1.1s ease; }
.loader.is-done { opacity: 0; visibility: hidden; }
.loader__bar span { width: 0%; transition: width 0.3s ease; } /* JS sets width */
```

## Pitfalls
- Skipping `renderer.compile` just defers the stutter to the user's first scroll — compile under the veil, not after.
- Transitioning `opacity` alone leaves an invisible veil swallowing clicks; transition `visibility` together so it drops out of the hit-testing.
- Forgetting `ScrollTrigger.refresh()` after reveal leaves triggers measured against stale layout, so panels fire at the wrong scroll positions.
- A linear progress bar that finishes instantly looks fake; the randomized increment sells the "loading" beat.
- Start `tick()` regardless of the bar so the world is already animating the moment the veil lifts — never reveal a frozen frame.
- A too-fast fade (`is-done`) clips the cinematic entrance; ~1.1s feels intentional, ~200ms feels like a flicker.
