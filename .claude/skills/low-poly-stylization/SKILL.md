---
name: low-poly-stylization
description: Achieve a painterly faceted look with MeshStandardMaterial flatShading plus vertexColors, simple primitives, and random vertex deformation. Use when an immersive WebGL/Three.js scene needs a cohesive dreamlike low-poly art style.
---

# Low-Poly Stylization

**Use when** you want every object in a scene to share one cohesive faceted, painterly art style — faceted shading, baked vertex colors from a limited palette, and clean primitives roughened into organic shapes.

## Technique
The whole look rests on two `MeshStandardMaterial` flags: `flatShading: true` (each face gets one normal, giving crisp facets) and `vertexColors: true` (color is read per-vertex, letting you bake gradients into geometry). Keep `roughness` high (0.7–0.95) and `metalness` near zero so light reads as soft and matte.

Use low-segment primitives — `ConeGeometry(r, h, 7, 2)`, `OctahedronGeometry`, half-`SphereGeometry(r, 8, 6, ...)` — then deform them: jitter every vertex by a small random vector and `computeVertexNormals()`. This breaks the mathematical perfection while keeping the facet count low. The same `deform()` helper used for terrain, islands, and rocks gives the world a consistent grammar.

Color either per-vertex (push into a `Float32BufferAttribute('color', 3)` by lerping `THREE.Color` palette stops along height or distance) or per-material with a tight palette. Pick 3–4 stops per palette (valley → peak, or rock → soil) and reuse them everywhere so the scene feels authored, not random. Add emissive on hero objects for glow.

## Pattern
```js
function deform(geo, amount) {              // shared organic-jitter helper
  const pos = geo.attributes.position, v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.set(v.x + (Math.random()-0.5)*amount,
          v.y + (Math.random()-0.5)*amount,
          v.z + (Math.random()-0.5)*amount)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
}
// flat-shaded + vertex-colored hero rock
const geo = new THREE.OctahedronGeometry(12, 1)
deform(geo, 2.0)
const palette = [new THREE.Color('#2a1145'), new THREE.Color('#7b2f6b'),
                 new THREE.Color('#ffd9a8')]
const colors = [], v = new THREE.Vector3()
for (let i = 0; i < geo.attributes.position.count; i++) {
  v.fromBufferAttribute(geo.attributes.position, i)
  const t = THREE.MathUtils.clamp(v.y / 12 * 0.5 + 0.5, 0, 1)
  const c = new THREE.Color().lerpColors(palette[0], palette[2], t)
  colors.push(c.r, c.g, c.b)
}
geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
geo.computeVertexNormals()
const mat = new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0.05,
})
```

## Pitfalls
- `flatShading: true` only takes effect with per-face normals; always `computeVertexNormals()` after deforming.
- `vertexColors: true` does nothing without a `color` BufferAttribute — and Three.js expects linear-space color values.
- Vertex colors *multiply* the material `color` (default white); leave it white or your palette tints unexpectedly.
- High-segment primitives defeat the style — keep segment counts low (cone 7×2, sphere 8×6) so facets stay visible.
- Reuse one tight palette across every object; ad-hoc colors per mesh make the world look incoherent.
- Deforming a shared geometry mutates it for all meshes using it — clone the geometry first if instances must differ.
