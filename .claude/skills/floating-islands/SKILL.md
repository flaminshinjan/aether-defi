---
name: floating-islands
description: Create low-poly deformed cones and spheres suspended in air, bobbing and slowly spinning with a crowning point-light glow. Use when an immersive WebGL/Three.js scene needs dreamlike floating land fragments.
---

# Floating Low-Poly Islands

**Use when** you want fragments of a world broken free and drifting in the air — faceted cones tipped downward as bedrock, capped with a half-sphere of glowing soil, each crowned by a soft point light and gently bobbing.

## Technique
Each island is a small `THREE.Group`. The base is a low-segment `ConeGeometry(r, r*2.2, 7, 2)`, deformed with a reusable jitter helper, then `rotateX(Math.PI)` so the point hangs downward like an inverted peak. The top is a half-sphere (`SphereGeometry(r, 8, 6, 0, Math.PI*2, 0, Math.PI/2)`), also deformed, using an emissive `MeshStandardMaterial` with `flatShading: true`.

The deform helper nudges every vertex by a small random vector and recomputes normals — this is the key trick that turns clean primitives into organic low-poly rock. Keep `amount` small (1–2.5) relative to radius so faces stay readable.

Add a `THREE.PointLight` near the crown for the glow and store animation state in `userData` (`baseY`, a random `bob` phase, a small `spin`). In the group's `update(t)`, set `position.y = baseY + Math.sin(t * 0.3 + bob) * 7` and slowly increment `rotation.y`. Scatter islands with random position/scale so the cluster feels natural.

## Pattern
```js
function deform(geo, amount) {            // reusable vertex-jitter helper
  const pos = geo.attributes.position, v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.x += (Math.random() - 0.5) * amount
    v.y += (Math.random() - 0.5) * amount
    v.z += (Math.random() - 0.5) * amount
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
}
const topMat = new THREE.MeshStandardMaterial({
  color: '#7c3f86', emissive: '#9b4bd6', emissiveIntensity: 0.25,
  flatShading: true, roughness: 0.7,
})
const island = new THREE.Group()
const r = 8 + Math.random() * 14
const baseGeo = new THREE.ConeGeometry(r, r * 2.2, 7, 2)
deform(baseGeo, 2.2); baseGeo.rotateX(Math.PI)         // point downward
const base = new THREE.Mesh(baseGeo, rockMat); base.position.y = -r * 0.8
const topGeo = new THREE.SphereGeometry(r, 8, 6, 0, Math.PI*2, 0, Math.PI/2)
deform(topGeo, 1.4)
island.add(base, new THREE.Mesh(topGeo, topMat))
const glow = new THREE.PointLight(0xb86bff, 1.2, 120, 2)
glow.position.y = r * 0.5; island.add(glow)
island.userData.baseY = island.position.y
island.userData.bob = Math.random() * Math.PI * 2
island.userData.spin = (Math.random() - 0.5) * 0.04
// in update(t):
island.position.y = island.userData.baseY + Math.sin(t*0.3 + island.userData.bob)*7
island.rotation.y += island.userData.spin * 0.01
```

## Pitfalls
- Always `computeVertexNormals()` inside `deform()` — skipping it leaves shading tied to the original primitive and the facets look flat-wrong.
- Keep deform `amount` small vs radius; large jitter tears the cone tip and the half-sphere seam apart.
- `rotateX(Math.PI)` flips the cone but also its base position — offset `base.position.y` afterward so it sits under the soil cap.
- Point lights are expensive; 10 islands ≈ 10 lights. Cap the count, set a tight `distance` (120), or share fewer lights.
- Give each island a unique `bob` phase, or the whole cluster pulses in unison and looks mechanical.
- Multiply `spin` by a small factor (`* 0.01`) in update — a raw `0.04` per frame spins them dizzyingly fast.
