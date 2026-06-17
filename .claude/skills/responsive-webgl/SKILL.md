---
name: responsive-webgl
description: Handle resize correctly (camera aspect, renderer + composer setSize, pixel-ratio reset) and scale quality on mobile by lowering pixel ratio and disabling heavy post-processing passes on small screens. Use when an immersive WebGL/Three.js scene must run across desktop and mobile.
---

# Responsive WebGL

**Use when** an immersive scene needs to look right and stay performant across window resizes, device rotation, and phones as well as desktops.

## Technique
A correct resize handler updates four things together: the camera's `aspect` (then `updateProjectionMatrix()`), the renderer's `setSize`, the renderer's `setPixelRatio` (re-applying the cap), and the composer's `setSize`. Miss any one and you get stretched geometry, blurry output, or misaligned bloom. The composer must be resized explicitly — it does not piggyback on the renderer.

On mobile, the same scene that runs at 60fps on desktop will struggle. Detect a small/low-power context (narrow viewport or `devicePixelRatio` heuristics) and scale quality: cap pixel ratio lower (e.g. `1.5` instead of `2`), reduce particle counts, and drop the most expensive post-processing — `UnrealBloomPass` is the usual first cut since it adds several extra full-screen passes.

Make quality a single function of viewport so resize and orientation changes re-evaluate it. Conditionally build the composer with or without bloom rather than toggling a pass mid-frame, which can leave a dangling render target.

## Pattern
```js
const isMobile = () => innerWidth < 820 || matchMedia('(pointer: coarse)').matches

function maxPixelRatio() {
  return Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2)
}

// build post-processing conditionally — bloom only on capable screens
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
let bloom = null
if (!isMobile()) {
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.85, 0.6, 0.62)
  composer.addPass(bloom)
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(maxPixelRatio())
  renderer.setSize(innerWidth, innerHeight)
  composer.setSize(innerWidth, innerHeight)
})
```

## Pitfalls
- Updating `camera.aspect` but forgetting `updateProjectionMatrix()` — the change never takes effect.
- Resizing the renderer but not the composer leaves bloom and other passes sampling at the old resolution.
- Re-applying `setPixelRatio(devicePixelRatio)` (uncapped) in the resize handler quietly undoes your performance cap.
- iOS fires `resize` on scroll due to the collapsing URL bar; debounce or guard against no-op resizes to avoid thrash.
- Toggling a composer pass per frame instead of building the chain once can leak render targets — decide quality at build/resize time.
- Assuming `innerWidth < 820` means mobile misses tablets and high-DPI laptops; combine with a `pointer: coarse` check.
