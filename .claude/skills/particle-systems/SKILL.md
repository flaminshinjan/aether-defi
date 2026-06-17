---
name: particle-systems
description: Build GPU particle systems with THREE.Points and a ShaderMaterial — per-point seeds, distance-scaled gl_PointSize, additive soft-circle alpha, and drift animation. Use when an immersive WebGL/Three.js scene needs fireflies or stardust.
---

# GPU Particle Systems (Fireflies / Stardust)

**Use when** you want thousands of glowing motes — drifting fireflies over a valley or a vast slow stardust field — animated entirely on the GPU via a custom `ShaderMaterial` on `THREE.Points`.

## Technique
Pack positions into a `Float32Array` and a `BufferGeometry`. Add a per-point `aSeed` attribute (one random float each) so every particle animates with a unique phase — this is what stops them moving in lockstep. The vertex shader reads `aSeed` and offsets position with `sin(uTime * speed + aSeed * k)` for organic drift, and computes a per-point glow varying.

Size points by distance: `gl_PointSize = (40.0 + aSeed*10.0) / -mv.z * 6.0`, where `mv` is the model-view position. Dividing by `-mv.z` gives correct perspective shrink for far particles. The fragment shader makes a soft circle by discarding fragments where `length(gl_PointCoord - 0.5) > 0.5` and feathering alpha with `smoothstep(0.5, 0.0, d)`.

Use `blending: THREE.AdditiveBlending`, `transparent: true`, `depthWrite: false` so overlapping motes accumulate light. Expose a `uNight` uniform to fade the whole field in/out by time of day, and update `uTime` each frame.

## Pattern
```js
const COUNT = 700
const positions = new Float32Array(COUNT * 3), seeds = new Float32Array(COUNT)
for (let i = 0; i < COUNT; i++) {
  positions[i*3+0] = (Math.random() - 0.5) * 260
  positions[i*3+1] = Math.random() * 90 - 10
  positions[i*3+2] = -Math.random() * 1300 + 100
  seeds[i] = Math.random() * 10
}
const geo = new THREE.BufferGeometry()
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uNight: { value: 1 } },
  vertexShader: /* glsl */`
    attribute float aSeed; uniform float uTime; varying float vGlow;
    void main(){
      vec3 p = position;
      p.x += sin(uTime * 0.4 + aSeed * 6.0) * 6.0;
      p.y += sin(uTime * 0.6 + aSeed * 3.0) * 4.0;
      vGlow = 0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 12.0);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (40.0 + aSeed * 10.0) / -mv.z * 6.0;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    varying float vGlow; uniform float uNight;
    void main(){
      vec2 c = gl_PointCoord - 0.5; float d = length(c);
      if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.0, d);
      vec3 col = mix(vec3(1.0,0.78,0.42), vec3(0.55,0.85,1.0), vGlow);
      gl_FragColor = vec4(col, a * (0.35 + vGlow * 0.65) * uNight);
    }`,
})
const pts = new THREE.Points(geo, mat)
pts.userData.update = (t) => (mat.uniforms.uTime.value = t)
```

## Pitfalls
- `gl_PointSize` is in pixels and capped by the GPU (`ALIASED_POINT_SIZE_RANGE`); huge near-particles silently clamp.
- Divide by `-mv.z` (negative view Z), not `mv.z`, for perspective sizing — getting the sign wrong inverts near/far.
- Without `depthWrite: false`, additive particles occlude each other and the glow goes blotchy.
- A per-point `aSeed` is essential; without it every particle shares one phase and the field pulses as one organism.
- `discard` for the circular mask is cheap but disables early-Z; that's fine for additive points, costly if you reuse this for opaque geometry.
- Animate in the vertex shader, never by rewriting the position buffer on the CPU each frame — that kills the GPU win.
