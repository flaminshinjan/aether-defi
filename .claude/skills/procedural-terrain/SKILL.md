---
name: procedural-terrain
description: Generate stylized low-poly mountains from simplex-noise fbm displacement with height-based vertex coloring and carved valleys. Use when building dreamlike immersive WebGL/Three.js terrain to scroll through.
---

# Procedural Low-Poly Terrain

**Use when** you need cinematic, painterly mountain ranges with a carved camera path and per-height color banding — the kind of terrain you fly or scroll across in an immersive Three.js scene.

## Technique
Start from a `PlaneGeometry` with high segment counts (e.g. 200×280) rotated flat with `geo.rotateX(-Math.PI/2)`. Walk `geo.attributes.position` and displace `v.y` by an fbm (fractal Brownian motion) sum of `createNoise2D()` octaves. Multiply the raw height by shaping masks so the world reads intentionally: a `valley` mask (`Math.pow(Math.min(Math.abs(x)/150, 1), 1.7)`) keeps a flat floor where the camera travels, and a `distFactor` makes peaks grow taller toward the journey's end.

Add a second, higher-frequency fbm as `(1.0 - ridge)` to sharpen a few hero ridgelines. Color each vertex by normalized elevation, lerping through a palette of `THREE.Color` stops (valley → slope → ridge → peak) and pushing into a `color` attribute.

Crucially, call `geo.computeVertexNormals()` **after** all displacement so lighting matches the new shape, and use `flatShading: true` for the faceted look. For cheap parallax depth, add flat `ShapeGeometry` silhouette bands far behind with a jagged noise-driven top edge.

## Pattern
```js
import { createNoise2D } from 'simplex-noise'
const noise2D = createNoise2D(() => 0.42) // seeded-ish stable look
const fbm = (x, z) => {
  let amp = 1, freq = 1, sum = 0, norm = 0
  for (let o = 0; o < 5; o++) {
    sum += amp * noise2D(x * freq, z * freq)
    norm += amp; amp *= 0.5; freq *= 2.0
  }
  return sum / norm
}
const geo = new THREE.PlaneGeometry(900, 1400, 200, 280)
geo.rotateX(-Math.PI / 2)
const pos = geo.attributes.position, colors = [], v = new THREE.Vector3()
for (let i = 0; i < pos.count; i++) {
  v.fromBufferAttribute(pos, i)
  const valley = Math.pow(Math.min(Math.abs(v.x) / 150, 1), 1.7)
  let h = fbm(v.x * 0.0045 + 10, v.z * 0.0045) * 0.5 + 0.5
  let elevation = Math.pow(h * valley, 1.25) * 230
  const ridge = Math.abs(fbm(v.x * 0.012, v.z * 0.012 + 40))
  elevation += (1.0 - ridge) * 55 * valley
  pos.setXYZ(i, v.x, elevation - 22, v.z)
  const t = THREE.MathUtils.clamp(elevation / 260, 0, 1)
  const c = new THREE.Color().lerpColors(
    new THREE.Color('#2a1145'), new THREE.Color('#ffd9a8'), t)
  colors.push(c.r, c.g, c.b)
}
geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
geo.computeVertexNormals()
const mat = new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0.05,
})
```

## Pitfalls
- Call `computeVertexNormals()` *after* displacing, never before — otherwise lighting is flat/wrong.
- `noise2D` returns roughly [-1, 1]; remap with `* 0.5 + 0.5` before raising to powers or you'll get NaNs from negatives.
- Seed the noise (`createNoise2D(() => 0.42)`) for a stable look across reloads; the default uses `Math.random`.
- High segment counts (200×280 ≈ 56k verts) are fine for one mesh but don't animate them on the CPU per frame.
- `flatShading` needs non-indexed or recomputed normals; `PlaneGeometry` handles this once you recompute.
- Use multiplicative masks (valley × distFactor) rather than additive — additive masks leak height into the flat camera path.
