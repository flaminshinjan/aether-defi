---
name: bloom-postprocessing
description: Add a soft cinematic glow with EffectComposer + RenderPass + UnrealBloomPass, tuning threshold/strength/radius so only bright emissive elements bloom, with resize and per-scene strength modulation. Use when immersive WebGL/Three.js glows (moon, sun, crystals, particles) need to truly radiate.
---

# Bloom Post-Processing

**Use when** emissive elements in an immersive scene (a moon, sunrise disc, glowing river, fireflies, crystals) need to bloom without smearing the whole frame into a haze.

## Technique
Bloom is driven by three knobs and the most important is `threshold`. Only pixels brighter than the threshold bloom, so a value around `0.62` lets the moon, sun disc and emissive crystals glow while keeping terrain and midtones crisp. Lower the threshold and ordinary surfaces start hazing; raise it and only the very brightest pixels survive.

`strength` is the bloom's intensity and `radius` its spread. A lush nocturnal look wants `strength ≈ 0.85–1.0` with a soft `radius ≈ 0.6`. Because bloom should dominate at night (when glows carry the image) and recede at dawn (when ambient light does the work), modulate `bloom.strength` per frame from your time-of-day factor.

The composer replaces `renderer.render` — call `composer.render()` in the tick loop instead. Add `RenderPass` first, then `UnrealBloomPass`. On resize you must `composer.setSize()` alongside the renderer, or bloom samples at a stale resolution and goes blurry or misaligned.

## Pattern
```js
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.85, // strength
  0.6,  // radius
  0.62  // threshold — only bright pixels bloom
)
composer.addPass(bloom)

// in tick(): lush at night (glows dominate), restrained at sunrise
bloom.strength = THREE.MathUtils.lerp(1.0, 0.55, day)
composer.render()

// in resize handler:
composer.setSize(innerWidth, innerHeight)
```

## Pitfalls
- Still calling `renderer.render(scene, camera)` after adding a composer — the passes never run; you must call `composer.render()`.
- A threshold near `0` blooms everything into mush; keep it high (~0.62) and make the things you want to glow genuinely bright/emissive.
- Forgetting `composer.setSize()` on resize leaves bloom sampling at the old size, producing soft or offset glow.
- Bloom reads HDR luminance, so post-tone-mapping a color of plain `#ffffff` may not cross the threshold — boost emissive intensity (e.g. `* 2.2`) in the source material.
- Animating `strength` without a sensible range washes the scene out at dawn; clamp the lerp endpoints.
- UnrealBloomPass is expensive; on mobile consider lowering its resolution vector or removing the pass entirely.
