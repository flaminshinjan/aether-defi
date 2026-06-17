---
name: mouse-parallax
description: Map pointer movement to smoothed offsets applied to camera position and lookAt so an immersive WebGL/Three.js world subtly breathes around the cursor. Use to add depth and life to a 3D scene without taking control away from scroll or the camera path.
---

# Mouse Parallax

**Use when** a 3D scene feels flat or locked-down and you want it to react gently to the cursor — the world leaning and shifting as the pointer moves — while scroll/path motion still leads.

## Technique

Normalize the pointer to roughly `[-1, 1]` on each axis: `(e.clientX / innerWidth - 0.5) * 2`. Store that as a *target* and ease an actual offset toward it each frame (`x += (tx - x) * 0.05`) so flicking the mouse glides rather than jerks. Then apply the eased offset on top of whatever the camera path already computed — add to `camera.position.x/y` and nudge the `lookAt` target. Because it's additive over the journey sample, parallax and scroll motion compose cleanly.

Subtlety is everything. Multiply by small world-space amounts (here `~14` on X, `~8` on Y for position, `~18` on the look target). Moving the look target slightly more than the camera creates a pleasing counter-rotation, as if the world pivots around a point ahead. Invert Y (`-mouse.y`) so moving the cursor up tilts the view up, matching intuition.

Use `pointermove` (covers mouse, pen, touch) and only update targets in the handler — all easing and application happens in the render loop, keeping input cheap and motion frame-coherent.

## Pattern

```js
const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2     // normalize to [-1, 1]
  mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2
})

const _look = new THREE.Vector3()
function tick() {
  mouse.x += (mouse.tx - mouse.x) * 0.05                   // ease offsets toward target
  mouse.y += (mouse.ty - mouse.y) * 0.05

  const { pos, target } = journey.sample(progress)
  camera.position.lerp(pos, 0.12)                          // path motion leads
  camera.position.x += mouse.x * 14                        // parallax rides on top
  camera.position.y += -mouse.y * 8                        // invert Y so up tilts up

  _look.copy(target)
  _look.x += mouse.x * 18                                  // look target moves a touch MORE → gentle counter-pivot
  camera.lookAt(_look)

  requestAnimationFrame(tick)
}
```

## Pitfalls

- Apply parallax *after* the path `lerp`, and to a copied look target — mutating the journey's cached target vector corrupts subsequent samples.
- Too-large multipliers turn a subtle breath into nausea-inducing swing; keep offsets in the low tens of world units.
- Forgetting to invert Y makes the tilt feel backwards.
- Easing in the event handler (which fires irregularly) instead of the render loop produces uneven motion — only set targets in the listener.
- Use `pointermove`, not `mousemove`, so touch and pen work too.
- Reuse a scratch `_look` vector; don't `new THREE.Vector3()` per frame.
