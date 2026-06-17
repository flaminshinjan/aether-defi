---
name: smooth-camera-easing
description: Frame-rate-aware lerp/damping of camera position plus a smoothed scroll progress (progress += (target - progress) * k) for buttery, non-snapping motion in immersive WebGL/Three.js. Use whenever scroll- or input-driven camera moves feel jittery or jumpy.
---

# Smooth Camera Easing

**Use when** raw scroll or pointer input drives the camera and the motion snaps, stutters, or feels twitchy. You want it to glide and settle, never teleport.

## Technique

Never apply input directly to the camera. Keep a `target` value (set from the event) and an actual value that chases it every frame with exponential damping: `value += (target - value) * k`. Small `k` = heavy, languid follow; larger `k` = snappier. Layer two stages for the smoothest result: first smooth the **scroll progress** scalar, then `lerp` the **camera position** toward the sampled point. Two cascaded low-pass filters absorb both jerky scroll deltas and any residual snap from path sampling.

In this world the constants are `progress += (targetProgress - progress) * 0.06` (a long, cinematic settle) and `camera.position.lerp(pos, 0.12)` (a tighter follow on top). Mouse offsets use `0.05`. These are tuned by feel — start there and adjust.

The catch: `value += (target - value) * k` assumes a fixed timestep. At 144 Hz it converges far faster than at 30 Hz, so motion speed varies with refresh rate. For correctness make it frame-rate-aware: `k = 1 - Math.pow(1 - kBase, dt * 60)`, which yields the same settle time regardless of FPS. For purely ambient motion the naive form is usually acceptable.

## Pattern

```js
let targetProgress = 0, progress = 0
ScrollTrigger.create({ trigger: '#scroll', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: (self) => { targetProgress = self.progress } })   // only sets the target

const clock = new THREE.Clock()
function tick() {
  const dt = clock.getDelta()

  // frame-rate-aware damping toward the same constants used in the world
  const damp = (base) => 1 - Math.pow(1 - base, dt * 60)
  progress += (targetProgress - progress) * damp(0.06)        // smooth the scroll scalar first

  const { pos, target } = journey.sample(progress)            // sample the spline at the eased progress
  camera.position.lerp(pos, damp(0.12))                       // then ease the camera toward it
  camera.lookAt(target)

  requestAnimationFrame(tick)
}
// Naive (fixed-step) form, fine for ambient scenes:
//   progress += (targetProgress - progress) * 0.06
//   camera.position.lerp(pos, 0.12)
```

## Pitfalls

- Applying scroll/pointer straight to the camera is the snap you're trying to kill — always chase a `target`.
- The naive `* 0.06` form is FPS-dependent: smoother on a 144 Hz display, sluggish at 30. Use the `pow` form when it matters.
- Too small a `k` and the camera lags noticeably behind fast scrolls; too large and you lose the glide. ~0.06–0.12 is the sweet spot.
- `lerp` mutates in place and returns the vector — don't reassign `camera.position = camera.position.lerp(...)`.
- Smooth the progress *scalar*, not the sampled position; smoothing position alone still passes through jerky scroll.
- `getElapsedTime()` and `getDelta()` both advance the clock; calling both per frame double-counts. Pick the right one.
