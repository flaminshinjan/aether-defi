---
name: flowing-water-shader
description: Build an animated emissive river/ribbon shader with flowing sine bands, soft edges, and a meandering vertex offset. Use when an immersive WebGL/Three.js scene needs glowing stylized water or an energy stream.
---

# Flowing Water / Energy Ribbon Shader

**Use when** you want a glowing "river of liquidity" — a flat ribbon that meanders through a valley with animated current bands flowing along its length and soft fading edges, rendered additively against a dark scene.

## Technique
Use a long `PlaneGeometry(70, 1400, 8, 220)` rotated flat. On the CPU, give the ribbon a gentle meander by offsetting `v.x += Math.sin(v.z * 0.012) * 28` per vertex once at build time — this bends the whole strip without per-frame cost. Recompute normals after.

The flow itself lives in the fragment shader. Combine two sine waves scrolling along `vUv.y` at different frequencies and speeds (`sin(vUv.y * 60.0 - uTime * 2.2)` for fine current, `sin(vUv.y * 18.0 - uTime * 1.1 + vUv.x * 6.0)` for broad swells) and blend them into a `current` value. Use that to `mix(uColorA, uColorB, current)` and boost highlights with `pow(current, 3.0)`.

For soft edges, multiply alpha by `smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)` so the banks fade out. Set the material `transparent: true`, `depthWrite: false`, and consider additive blending for a luminous glow on dark backdrops. Drive everything from a single `uTime` uniform in your update loop.

## Pattern
```js
const geo = new THREE.PlaneGeometry(70, 1400, 8, 220)
geo.rotateX(-Math.PI / 2)
const pos = geo.attributes.position, v = new THREE.Vector3()
for (let i = 0; i < pos.count; i++) {        // bake the meander once
  v.fromBufferAttribute(pos, i)
  v.x += Math.sin(v.z * 0.012) * 28
  pos.setXYZ(i, v.x, v.y, v.z)
}
geo.computeVertexNormals()
const uniforms = {
  uTime: { value: 0 },
  uColorA: { value: new THREE.Color('#46e6ff') },
  uColorB: { value: new THREE.Color('#b06bff') },
  uOpacity: { value: 0.9 },
}
const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms,
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    varying vec2 vUv;
    uniform float uTime, uOpacity; uniform vec3 uColorA, uColorB;
    void main(){
      float flow  = sin(vUv.y * 60.0 - uTime * 2.2) * 0.5 + 0.5;
      float flow2 = sin(vUv.y * 18.0 - uTime * 1.1 + vUv.x * 6.0) * 0.5 + 0.5;
      float current = flow * 0.4 + flow2 * 0.6;
      vec3 col = mix(uColorA, uColorB, current) + pow(current, 3.0) * 0.6;
      float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
      gl_FragColor = vec4(col * (0.5 + current * 0.6), edge * uOpacity);
    }`,
})
const mesh = new THREE.Mesh(geo, mat)
mesh.userData.update = (t) => { uniforms.uTime.value = t }
```

## Pitfalls
- Bake the meander into the geometry once; don't recompute `Math.sin` per vertex per frame on the CPU.
- With `depthWrite: false`, draw order matters — a transparent ribbon over transparent water can z-fight; lift it slightly (`mesh.position.y = -20`).
- Subtract speed-times-time inside the sine (`vUv.y * 60.0 - uTime`), not added phase elsewhere, so the current visibly *flows* one direction.
- Two close frequencies look like a moiré buzz; keep them clearly separated (60 vs 18) for layered current.
- Additive blending blows out to white over light skies — pair this with dark scenes or clamp the glow term.
- Edge `smoothstep` must use matching bounds (`0→0.18` and `1→0.82`); asymmetric values make one bank harder than the other.
