---
name: atmospheric-fog-depth
description: Fake painterly aerial depth with FogExp2 plus layered parallax silhouettes (ShapeGeometry mountains at increasing distance and scale) color-matched to the horizon. Use when an immersive WebGL/Three.js scene needs cinematic atmospheric depth without heavy geometry.
---

# Atmospheric Fog & Depth

**Use when** an immersive scene needs the illusion of vast, layered distance — receding mountain ranges, valley haze — without paying for real far-field geometry.

## Technique
Aerial perspective is the cue your eye reads as depth: distant things lose contrast and tint toward the sky. `FogExp2` reproduces this cheaply with exponential falloff. Match `scene.fog.color` to your horizon/sky-low color (`#11183a` at night) so silhouettes fade into the backdrop instead of clipping against a hard edge. Tune `density` (≈`0.0016`) until the farthest layer is nearly dissolved.

Build depth from a handful of flat silhouette layers, not a heightfield. Use `ShapeGeometry` mountain profiles placed at increasing `-z` distances and increasing `scale`, each tinted slightly closer to the fog color the farther back it sits. Because they are flat and fog-affected, the eye reads them as a painted matte, and they parallax naturally as the camera moves.

Keep near layers darker/more saturated and far layers paler — that contrast gradient sells the distance more than the silhouette shape does. Set layer materials `fog: true` so the engine blends them toward the fog color automatically.

## Pattern
```js
const fogColor = new THREE.Color('#11183a')
scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.0016)

function mountainShape(w, h) {
  const s = new THREE.Shape()
  s.moveTo(-w, 0)
  for (let x = -w; x <= w; x += w / 8) {
    s.lineTo(x, h * (0.4 + 0.6 * Math.abs(Math.sin(x * 0.013))))
  }
  s.lineTo(w, 0)
  return new THREE.ShapeGeometry(s)
}

const ranges = new THREE.Group()
const near = new THREE.Color('#243056') // horizon-low tone
const layers = [
  { z: -400,  scale: 1.0, t: 0.15 },
  { z: -800,  scale: 1.8, t: 0.45 },
  { z: -1300, scale: 2.8, t: 0.75 }, // farthest: closest to fog color
]
layers.forEach(({ z, scale, t }) => {
  const color = near.clone().lerp(fogColor, t)
  const mat = new THREE.MeshBasicMaterial({ color, fog: true })
  const m = new THREE.Mesh(mountainShape(600, 220), mat)
  m.position.set(0, -40, z)
  m.scale.setScalar(scale)
  ranges.add(m)
})
scene.add(ranges)
```

## Pitfalls
- Fog color that doesn't match the horizon leaves a visible seam where silhouettes meet the sky.
- `MeshBasicMaterial` ignores fog unless `fog: true` is set (it defaults true, but lighting materials need the flag respected too) — verify your far layers actually recede.
- Placing all layers at the same tint flattens the parallax; the per-layer lerp toward fog color is what creates depth.
- `FogExp2` density is unitless and scene-scale dependent — a value tuned for a 3000-unit far plane will be invisible at small scales.
- ShapeGeometry is single-sided; if the camera passes behind a layer it vanishes — keep layers far in `-z` or set `side: THREE.DoubleSide`.
