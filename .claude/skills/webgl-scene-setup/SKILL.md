---
name: webgl-scene-setup
description: Set up a production-ready Three.js renderer, scene and camera with cinematic ACES tone mapping, sRGB output, fog, resize handling and a clock-driven render loop. Use when starting any immersive WebGL/Three.js design scene.
---

# WebGL Scene Setup

**Use when** you are bootstrapping any immersive Three.js world and need a correct, cinematic renderer/scene/camera baseline before adding geometry or effects.

## Technique
Color management is the foundation: set `renderer.outputColorSpace = SRGBColorSpace` and `toneMapping = ACESFilmicToneMapping` so your authored hex colors and emissive glows map to a filmic curve instead of clipping to flat white. Treat `toneMappingExposure` (start near `1.05`) as a master brightness dial you can later animate per scene.

Cap pixel ratio with `Math.min(window.devicePixelRatio, 2)` — uncapped DPR on retina/mobile quadruples fragment work for no visible gain. Use `powerPreference: 'high-performance'` and `antialias: true` for a desktop-first cinematic look.

Add `FogExp2` early and key its color off the same value as your horizon/sky so distant geometry dissolves into the backdrop rather than ending on a hard line. A wide camera FOV (`58`) plus a deep `far` plane (`3000`) gives an epic, scrollable vista.

Drive everything from a single `THREE.Clock` in one `requestAnimationFrame` loop. Pass `clock.getElapsedTime()` into each object's `userData.update(t)` so shaders and animations share one time source.

## Pattern
```js
import * as THREE from 'three'

const canvas = document.getElementById('world')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05

const scene = new THREE.Scene()
const fogColor = new THREE.Color('#11183a')
scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.0016)

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 3000)
camera.position.set(0, 130, 230)

const clock = new THREE.Clock()
const animated = [] // each item exposes userData.update(t)

function tick() {
  const t = clock.getElapsedTime()
  animated.forEach((o) => o.userData.update && o.userData.update(t))
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}
tick()
```

## Pitfalls
- Forgetting `outputColorSpace = SRGBColorSpace` makes everything look washed-out and desaturated; it must be set before colors are authored.
- Setting `toneMappingExposure` per-frame without a base value causes flicker — pick a base (1.05) and lerp from it.
- Uncapped `devicePixelRatio` tanks framerate on high-DPI screens; always wrap in `Math.min(..., 2)`.
- A `near` plane too small (e.g. `0.001`) with a large `far` causes z-fighting on distant geometry; `0.1`/`3000` is a safe cinematic range.
- Calling `getDelta()` and `getElapsedTime()` on the same clock in one frame corrupts timing — pick one accessor.
