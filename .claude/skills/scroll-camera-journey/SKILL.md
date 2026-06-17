---
name: scroll-camera-journey
description: Drive a cinematic camera along a Catmull-Rom spline from scroll, with a separate lookAt-target curve and stations mapped to scroll fractions, for immersive WebGL/Three.js. Use when building a scroll-as-travel 3D journey through a world.
---

# Scroll Camera Journey

**Use when** the page *is* the journey: scrolling should fly the camera through a 3D world along a designed path, glancing at points of interest, with named "stations" you can also jump to.

## Technique

Define two `THREE.CatmullRomCurve3`s — one for camera **position**, one for the **lookAt target** — from a handful of hand-placed control points. Splitting position from target is what makes it cinematic: the camera can bank up a slope while its gaze sweeps ahead to the horizon, instead of rigidly staring down the velocity vector. Use `'catmullrom'` with a `tension` around `0.4` for smooth, non-overshooting arcs.

Sample both curves at a single normalized progress `p ∈ [0,1]` with `curve.getPoint(p, out)`, reusing scratch `Vector3`s. Map stations to evenly-spaced fractions: station `i` lives at `i / (STATIONS - 1)`. You can interpolate any per-station data (time-of-day, fog, exposure) across the same `p` by finding the segment index and a local `f`.

A GSAP `ScrollTrigger` with `scrub: true` over the scroll container feeds `self.progress` into a `targetProgress`; the render loop eases the actual `progress` toward it (see the smooth-camera-easing skill) before sampling. Keep curve construction out of the loop — build once, sample every frame.

## Pattern

```js
export const STATIONS = 5
const cameraPoints = [
  new THREE.Vector3(0, 130, 230),     // 0 high overlook
  new THREE.Vector3(-34, 24, -210),   // 1 skim the river
  new THREE.Vector3(46, 96, -640),    // 2 bank up the slope
  new THREE.Vector3(-20, 360, -1040), // 3 above the clouds
  new THREE.Vector3(0, 470, -1360),   // 4 adrift in open sky
]
const targetPoints = [ /* where the camera LOOKS at each station — a separate curve */
  new THREE.Vector3(0, 40, -260), new THREE.Vector3(10, 30, -560),
  new THREE.Vector3(-10, 180, -1000), new THREE.Vector3(0, 420, -1500), new THREE.Vector3(0, 520, -1800),
]

export function createJourney() {
  const camCurve = new THREE.CatmullRomCurve3(cameraPoints, false, 'catmullrom', 0.4)
  const tgtCurve = new THREE.CatmullRomCurve3(targetPoints, false, 'catmullrom', 0.4)
  const _pos = new THREE.Vector3(), _tgt = new THREE.Vector3()

  function sample(p) {
    p = THREE.MathUtils.clamp(p, 0, 1)
    camCurve.getPoint(p, _pos)
    tgtCurve.getPoint(p, _tgt)
    return { pos: _pos, target: _tgt }
  }
  const progressForStation = (i) => THREE.MathUtils.clamp(i / (STATIONS - 1), 0, 1)
  return { sample, progressForStation }
}

// wiring: scroll → normalized progress
ScrollTrigger.create({ trigger: '#scroll', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: (self) => { targetProgress = self.progress } })
// each frame: const { pos, target } = journey.sample(progress); camera.position.lerp(pos, 0.12); camera.lookAt(target)
```

## Pitfalls

- A single curve for both position and lookAt looks robotic — the separate target curve is the whole point.
- `tension` near 1 overshoots and whips the camera; ~0.4 keeps arcs taut. Tune visually.
- `getPoint(p, out)` distributes by curve parameter, not arc length, so uneven control-point spacing makes speed surge — use `getPointAt` (arc-length) if constant speed matters.
- Always `clamp(p, 0, 1)`; an unclamped progress samples off the curve and flings the camera.
- Build the curves once, never inside the tick loop.
- Reuse scratch `Vector3`s passed into `getPoint`; the two-arg form exists to avoid per-frame allocation.
