---
name: day-night-cycle
description: Drive lighting, fog, exposure and sky-shader uniforms from a single normalized time-of-day factor, lerping palettes and moving the sun up while the moon sets. Use when an immersive WebGL/Three.js scene must transition cohesively from night to sunrise.
---

# Day–Night Cycle

**Use when** an immersive scene must shift convincingly across time of day (e.g. midnight → sunrise) and every visual system — lights, fog, exposure, sky — has to stay in sync.

## Technique
Use one normalized `day` factor in `[0,1]` as the single source of truth, then derive everything from it. This guarantees the key light, hemisphere bounce, fog, tone-mapping exposure and sky uniforms never drift out of phase. In a scroll-driven scene, `day` comes from journey progress; in a timed scene it comes from a clock.

Define palette endpoints as `THREE.Color` pairs (night and dawn) and `lerpColors(a, b, day)` between them — key light from cool moon-blue `#bcd2ff` to warm sun `#ffce8f`, hemisphere sky from `#9fb6ff` to `#ffd9b0`, ground bounce from deep indigo to dusky rose. Lerp scalar intensities the same way with `THREE.MathUtils.lerp`.

Move the celestial bodies in opposition: the sun's `y` climbs from below the horizon to high, the moon's sinks past it. Point the key `DirectionalLight` at whichever body dominates (`day < 0.5 ? moonDir : sunDir`) so shadows and highlights come from the visible source. Feed the same `day`, `uSunDir` and `uMoonDir` into the sky shader so the rendered disc and the actual light agree.

## Pattern
```js
// palettes
const moonKey = new THREE.Color('#bcd2ff'), sunKey = new THREE.Color('#ffce8f')
const hemiNight = new THREE.Color('#9fb6ff'), hemiDawn = new THREE.Color('#ffd9b0')
const fogNight = new THREE.Color('#10163a'), fogDawn = new THREE.Color('#e9b9a0')
const _sunDir = new THREE.Vector3(), _moonDir = new THREE.Vector3()

function applyTimeOfDay(day) {
  // celestial bodies move in opposition
  _sunDir.set(0.24, THREE.MathUtils.lerp(-0.28, 0.42, day), -1).normalize()
  _moonDir.set(-0.2, THREE.MathUtils.lerp(0.46, -0.22, day), -1).normalize()

  const keyDir = day < 0.5 ? _moonDir : _sunDir
  key.position.copy(keyDir).multiplyScalar(400)
  key.color.lerpColors(moonKey, sunKey, day)
  key.intensity = THREE.MathUtils.lerp(0.95, 2.2, day)

  hemi.color.lerpColors(hemiNight, hemiDawn, day)
  hemi.intensity = THREE.MathUtils.lerp(0.5, 0.72, day)

  scene.fog.color.lerpColors(fogNight, fogDawn, day)
  scene.fog.density = THREE.MathUtils.lerp(0.0017, 0.0009, day)
  renderer.toneMappingExposure = THREE.MathUtils.lerp(1.02, 1.3, day)

  skyU.uDay.value = day
  skyU.uSunDir.value.copy(_sunDir)
  skyU.uMoonDir.value.copy(_moonDir)
}
```

## Pitfalls
- Driving systems from separate timers instead of one `day` factor causes the sky to say "dawn" while the lights still read "night".
- Forgetting to `.normalize()` direction vectors makes the sky-shader dot products (sun/moon disc) wrong.
- Raising exposure and fog brightness together can blow out the dawn — keep exposure lerp modest (≈1.02→1.3).
- Lerping `Color` with plain numeric interpolation in sRGB space muddies midtones; `lerpColors` handles it, but keep endpoints saturated.
- Switching the key light's source abruptly at `day === 0.5` is fine for direction, but also fade nocturnal glows with a `smoothstep` so the handoff reads smooth.
