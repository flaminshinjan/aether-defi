---
name: volumetric-clouds
description: Fake cheap volumetric clouds with soft additive/normal sprite billboards drawn from a canvas radial-gradient texture, drifting slowly. Use when an immersive WebGL/Three.js scene needs atmospheric haze without real volumetrics.
---

# Fake Volumetric Clouds (Sprite Billboards)

**Use when** you need soft atmospheric cloud puffs or haze that always faces the camera and costs almost nothing — a convincing fake for true volumetric rendering in a stylized Three.js world.

## Technique
Generate one soft texture procedurally: a `<canvas>` with a `createRadialGradient` from opaque white center to transparent edge. Wrap it in a `THREE.CanvasTexture` — no image asset needed, and the gradient gives every puff naturally feathered borders.

Use `THREE.Sprite` with a `SpriteMaterial` (`map`, `transparent: true`, `depthWrite: false`). Sprites are camera-facing billboards, so a handful read as soft clouds from any angle. Tint with `color` and keep `opacity` low (0.12–0.3) — overlapping low-opacity sprites is what sells the volumetric depth. `NormalBlending` gives soft mass; `AdditiveBlending` gives luminous mist.

Scatter many sprites at varied positions and non-uniform scales (`scale.set(w, w * 0.55, 1)` for flatter clouds). Animate cheaply by drifting `position.x` with a slow `Math.sin(t * 0.05 + position.z)` so layers parallax. Clone the material per sprite only if you need per-cloud opacity; otherwise share one material to save draw state.

## Pattern
```js
function makeSoftTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}
const tex = makeSoftTexture()
const baseMat = new THREE.SpriteMaterial({
  map: tex, transparent: true, depthWrite: false,
  opacity: 0.22, color: new THREE.Color('#d9b6ff'),
  blending: THREE.NormalBlending,
})
const clouds = []
for (let i = 0; i < 26; i++) {
  const s = new THREE.Sprite(baseMat.clone())
  const scale = 220 + Math.random() * 360
  s.scale.set(scale, scale * 0.55, 1)
  s.position.set((Math.random()-0.5)*1200, 90 + Math.random()*240,
                -Math.random()*1500 + 150)
  s.material.opacity = 0.12 + Math.random() * 0.18
  s.userData.driftSpeed = 4 + Math.random() * 6
  s.userData.baseX = s.position.x
  clouds.push(s); group.add(s)
}
// in update(t):
clouds.forEach((c) => {
  c.position.x = c.userData.baseX + Math.sin(t*0.05 + c.position.z)*c.userData.driftSpeed
})
```

## Pitfalls
- Set `depthWrite: false` or clouds carve hard depth edges into each other and the soft look collapses.
- Keep per-sprite opacity low and rely on overlap; one opaque puff looks like a sticker, ten faint ones look volumetric.
- `material.clone()` per sprite is needed for per-cloud opacity but multiplies draw calls — share the material when uniform.
- Power-of-two canvas size (128) keeps mipmapping/wrapping happy; odd sizes can blur or warn.
- Sprites always face the camera, so they can't tilt — for ground fog that should lie flat, use a textured plane instead.
- Transparent sprites need correct sort order; very large overlapping ones can flicker — spread their Z and avoid coincident positions.
