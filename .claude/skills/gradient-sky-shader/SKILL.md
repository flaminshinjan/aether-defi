---
name: gradient-sky-shader
description: Render a painterly day-cycle sky dome with a custom fragment shader doing vertical gradients, dot-product sun/moon discs, and hash-twinkling stars. Use when an immersive WebGL/Three.js scene needs a controllable night-to-dawn skybox.
---

# Gradient Sky Dome Shader

**Use when** you want a cheap, fully controllable sky with no textures — a large inward-facing sphere whose fragment shader paints a vertical gradient, places sun and moon discs, and scatters twinkling stars, all blendable by a single `uDay` uniform.

## Technique
Build a big `SphereGeometry(1000, 64, 40)` with `side: THREE.BackSide` and `depthWrite: false` so it always renders behind everything. The vertex shader just forwards `vDir = normalize(position)`. In the fragment shader, derive a vertical coordinate `h = clamp(dir.y * 0.5 + 0.5, 0, 1)` and `mix()` palette stops (low → mid → top) with `smoothstep` bands to get a soft gradient.

Maintain two full gradients — a cold night palette and a warm dawn palette — and cross-fade them with `mix(night, dawn, smoothstep(0.0, 1.0, uDay))`. Add a horizon glow via `pow(1.0 - h, 2.2)`.

Sun and moon are placed by `dot(dir, normalize(uSunDir))`: a tight `smoothstep(0.9988, 0.9994, sd)` makes the crisp disc, and stacked `pow(sd, N)` terms make the halo. Gate each body's visibility on time of day and its height (`smoothstep(-0.15, 0.05, sunDir.y)`). Stars use `step()` on a `hash()` of a quantized direction, multiplied by a `sin(uTime...)` twinkle and faded out by daylight.

## Pattern
```js
const uniforms = {
  uTime: { value: 0 }, uDay: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0.25, -0.25, -1).normalize() },
  uMoonDir: { value: new THREE.Vector3(-0.3, 0.5, -1).normalize() },
  uSunColor: { value: new THREE.Color('#fff1d6') },
}
// fragment shader body:
const frag = /* glsl */`
  varying vec3 vDir;
  uniform float uTime, uDay; uniform vec3 uSunDir, uSunColor;
  float hash(vec3 p){ return fract(sin(dot(p, vec3(17.1,113.5,57.3))) * 4768.13); }
  void main(){
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(vec3(0.07,0.09,0.22), vec3(0.19,0.29,0.62),
                   smoothstep(0.45, 1.0, h));
    // sun disc + halo via dot()
    float sd = max(dot(dir, normalize(uSunDir)), 0.0);
    float sunDisc = smoothstep(0.9988, 0.9994, sd);
    float sunHalo = pow(sd, 350.0)*1.6 + pow(sd, 24.0)*0.45 + pow(sd, 6.0)*0.12;
    float sunVisible = smoothstep(0.0, 0.35, uDay)
                     * smoothstep(-0.15, 0.05, normalize(uSunDir).y);
    col += uSunColor * (sunDisc * 2.2 + sunHalo) * sunVisible;
    // twinkling stars, night only
    float star = step(0.9973, hash(floor(dir * 260.0)));
    float twinkle = 0.55 + 0.45 * sin(uTime*2.0 + hash(floor(dir*260.0))*30.0);
    col += star * twinkle * (1.0 - smoothstep(0.0, 0.7, uDay))
                * smoothstep(0.2, 0.7, h) * 0.9;
    gl_FragColor = vec4(col, 1.0);
  }`
const mat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, uniforms, vertexShader, fragmentShader: frag,
})
```

## Pitfalls
- Forgetting `side: THREE.BackSide` paints the dome inside-out and it culls; you'll see nothing.
- Set `depthWrite: false` (and let it render early) so the dome never occludes scene geometry.
- Normalize `uSunDir`/`uMoonDir` both on upload *and* in-shader; an unnormalized dir breaks the `dot()` disc threshold.
- The disc `smoothstep` window is razor-thin (≈0.0006); widen it for a bigger sun, but too wide looks like a blob.
- Quantize direction (`floor(dir * 260.0)`) for stars — hashing the raw float gives shimmering noise, not stable points.
- Drive `uDay` from scroll progress, not real time, so the night→dawn arc maps to the user's journey.
