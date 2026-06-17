---
name: idle-ambient-motion
description: Reusable bob/drift/breathe/spin loops driven by elapsed time plus a per-object phase so a static immersive WebGL/Three.js scene always feels alive. Use whenever props sit motionless and the world reads as frozen.
---

# Idle Ambient Motion

**Use when** objects in an immersive Three.js scene are technically placed but visually inert — crystals, islands, foliage, UI hologram — and you want subtle perpetual motion without bespoke animation per object.

## Technique

Pick a base value once at spawn (`baseY`, base scale, base rotation) and offset it each frame with a cheap periodic function of elapsed time. The four staples: **bob** (`baseY + sin(t*f + phase) * amp`), **drift** (slow `sin` on X/Z), **breathe** (scale by `1 + sin(...) * small`), and **spin** (accumulate `rotation += rate * dt-ish`). Always read from the stored base, never the current value, or floating-point drift accumulates and the object wanders off.

The make-or-break detail is a per-object random `phase` (and often a random `spin`/`bob` rate). Without it, every object bobs in perfect unison — instantly legible as a script. With a random phase per object the scene shimmers organically.

Drive everything from a single `clock.getElapsedTime()` shared across the scene and dispatch via one `userData.update(t)` hook per group. The tick loop then just does `animated.forEach(o => o.userData.update && o.userData.update(t))`.

## Pattern

```js
// at spawn: capture a base + a unique phase per object
crystals.forEach((c) => {
  c.userData.spin = (Math.random() - 0.5) * 0.6   // signed: some spin each way
  c.userData.bob = Math.random() * Math.PI * 2     // phase offset
  c.userData.baseY = c.position.y                   // stable anchor
})

// in the tick loop, t = clock.getElapsedTime()
group.userData.update = (t) => {
  crystals.forEach((c) => {
    c.rotation.y += c.userData.spin * 0.01          // continuous spin
    c.rotation.x += c.userData.spin * 0.006
    c.position.y = c.userData.baseY + Math.sin(t * 0.6 + c.userData.bob) * 6   // bob off base
  })
}

// reusable helpers you can drop on any object
const bob     = (o, t, f, amp) => { o.position.y = o.userData.baseY + Math.sin(t * f + o.userData.phase) * amp }
const breathe = (o, t, f, amt) => { const s = 1 + Math.sin(t * f + o.userData.phase) * amt; o.scale.setScalar(o.userData.baseScale * s) }
const drift   = (o, t, f, amp) => { o.position.x = o.userData.baseX + Math.sin(t * f + o.userData.phase) * amp }
```

## Pitfalls

- Reading and re-offsetting the *current* position instead of a stored base makes objects slowly drift away forever.
- Omitting a per-object `phase` makes the whole scene pulse in lockstep — the tell-tale sign of canned motion.
- Keep amplitudes small (a few units, a few % scale); idle motion should be felt, not stared at.
- `rotation += rate * 0.01` is frame-count-based; for strict frame-rate independence multiply by real `dt`.
- Forgetting the `o.userData.update &&` guard crashes the tick loop the moment one group lacks an update fn.
- Don't allocate vectors/colors inside the per-frame loop; precompute and mutate in place.
