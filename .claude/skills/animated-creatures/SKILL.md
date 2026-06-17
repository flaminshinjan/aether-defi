---
name: animated-creatures
description: Build living inhabitants from simple geometry (pulsing jellyfish with a PointLight, flapping mantas/birds) for immersive WebGL/Three.js scenes. Use when a 3D world needs organic, self-animating creatures rather than static props.
---

# Animated Creatures

**Use when** an immersive Three.js scene feels dead and you want cheap, lively inhabitants — bioluminescent jellyfish, flapping flocks, floating crystals — built from primitives, not loaded models.

## Technique

Compose each creature from a `THREE.Group` of primitives (a half-sphere bell, `THREE.Line` tentacles, cones + triangle wings). Store the animated sub-meshes on `group.userData` (`bell`, `tentacles`, `wings`) so the tick loop can reach them without re-traversing the graph.

Give every creature a random `phase` (and `speed`, `seed`) at spawn. Driving sines with `t * speed + phase` desynchronizes the herd so 7 jellyfish never pulse in lockstep. Emissive materials plus a small `PointLight` per glowing creature read beautifully under bloom — but lights are expensive, so reserve them for the hero creatures.

Expose one `group.userData.update(t)` per creature group; the world's tick loop just calls it. Pulse the bell by scaling inversely on Y (`set(pulse, 1/pulse, pulse)`) to preserve volume; drift position with low-frequency sines.

## Pattern

```js
function makeJellyfish() {
  const g = new THREE.Group()
  const bellGeo = new THREE.SphereGeometry(1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  const bell = new THREE.Mesh(bellGeo, new THREE.MeshStandardMaterial({
    color: '#ff8fd0', emissive: '#c44bff', emissiveIntensity: 0.9,
    transparent: true, opacity: 0.78, side: THREE.DoubleSide,
  }))
  g.add(bell, new THREE.PointLight(0xff7ad6, 2.2, 90, 2))

  const tentacles = []
  const tMat = new THREE.LineBasicMaterial({ color: '#ffc2f0', transparent: true, opacity: 0.55 })
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, pts = []
    for (let s = 0; s <= 8; s++) pts.push(new THREE.Vector3(Math.cos(a) * 0.7, -s * 0.35, Math.sin(a) * 0.7))
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), tMat))
    tentacles.push(g.children[g.children.length - 1])
  }
  g.userData.bell = bell
  g.userData.tentacles = tentacles
  return g
}

// in createCreatures(): seed each spawn, then animate them all from one update()
jellies.forEach((j) => { j.userData.phase = Math.random() * Math.PI * 2; j.userData.speed = 0.3 + Math.random() * 0.4 })
group.userData.update = (t) => jellies.forEach((j) => {
  const p = j.userData.phase
  j.position.y = j.userData.driftY + Math.sin(t * j.userData.speed + p) * 10
  const pulse = 1 + Math.sin(t * 1.6 + p) * 0.12
  j.userData.bell.scale.set(pulse, 1 / pulse, pulse)
  j.userData.tentacles.forEach((tn, k) => { tn.rotation.x = Math.sin(t * 1.4 + p + k) * 0.25 })
})
```

## Pitfalls

- Per-creature `PointLight`s blow your light budget — limit them and rely on `emissiveIntensity` + bloom for the rest.
- Without a random `phase` every creature animates identically, which reads as mechanical, not alive.
- Cache animated sub-meshes on `userData`; calling `group.getObjectByName()` every frame is wasteful.
- Share one material across the whole flock; cloning a material per creature multiplies draw-state and GPU memory.
- Scale the bell with `1/pulse` on the off-axis or it visibly inflates instead of pulsing.
- Reuse scratch `Vector3`s in the loop — allocating `new THREE.Vector3()` per frame thrashes the GC.
