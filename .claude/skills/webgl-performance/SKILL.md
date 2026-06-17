---
name: webgl-performance
description: Hit framerate budgets with pixel-ratio caps, InstancedMesh for repeated creatures/foliage, draw-call budgeting, additive Points for particles, fog/frustum culling, and renderer.compile to pre-warm shaders. Use when an immersive WebGL/Three.js scene drops frames or stutters on load.
---

# WebGL Performance

**Use when** an immersive scene stutters, drops below 60fps, or hitches when new geometry first appears.

## Technique
The two cheapest wins are pixel-ratio capping and draw-call reduction. `Math.min(devicePixelRatio, 2)` halves or quarters fragment work on high-DPI screens. Every distinct mesh is a draw call, so the bottleneck in a populated world is usually the CPU issuing thousands of them — not the GPU shading them.

For anything repeated — creatures, foliage, crystals, rocks — use `InstancedMesh`. One geometry, one material, N transforms set via `setMatrixAt`, and it renders in a single draw call regardless of count. This is the difference between 500 draw calls and 1.

For particles (fireflies, dust, stars), never use meshes. Use `THREE.Points` with `AdditiveBlending` and `depthWrite: false`: points are one vertex each, additive blending gives the glowy accumulation that bloom amplifies, and disabling depth-write avoids sorting artifacts.

Let fog double as culling: with `FogExp2` tuned so the far plane is fully fogged, you can cull objects beyond the fog distance with no visible pop. Keep `frustumCulled = true` (the default) on everything. Finally, call `renderer.compile(scene, camera)` during your loader so shaders compile before the reveal instead of hitching on first frame.

## Pattern
```js
// One draw call for many creatures via InstancedMesh
const count = 240
const mesh = new THREE.InstancedMesh(geo, mat, count)
const m = new THREE.Matrix4()
for (let i = 0; i < count; i++) {
  m.makeTranslation((Math.random() - 0.5) * 1800, Math.random() * 60, (Math.random() - 0.5) * 1800)
  mesh.setMatrixAt(i, m)
}
mesh.instanceMatrix.needsUpdate = true
scene.add(mesh)

// Additive Points for particle glows (cheap, bloom-friendly)
const pts = new THREE.Points(particleGeo, new THREE.PointsMaterial({
  size: 3, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}))
scene.add(pts)

// Pre-warm shaders during the loader so first frame doesn't hitch
renderer.compile(scene, camera)
```

## Pitfalls
- Forgetting `instanceMatrix.needsUpdate = true` after `setMatrixAt` leaves all instances stacked at the origin.
- `Points` without `depthWrite: false` causes flickering sort artifacts and occludes bloom incorrectly.
- Calling `renderer.compile()` after geometry is added but lights change later still hitches — compile after the full scene graph is assembled.
- InstancedMesh shares one material, so per-instance color needs `instanceColor`, not separate materials (which would defeat the purpose).
- Capping pixel ratio in setup but resetting `setPixelRatio(devicePixelRatio)` in the resize handler silently reintroduces the cost — cap it there too.
- AdditiveBlending over a bright sky can wash out; reserve it for glows against darker backdrops.
