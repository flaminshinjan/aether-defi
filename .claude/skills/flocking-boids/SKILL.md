---
name: flocking-boids
description: Cheap circling/orbiting flock motion via parametric per-agent orbits (radius/speed/offset) with heading orientation, as a lightweight alternative to true boids, for immersive WebGL/Three.js scenes. Use when you want a believable flock without neighbor-query cost.
---

# Flocking Boids (parametric)

**Use when** you want a flock of birds/mantas/fish circling through an immersive Three.js world and full boids (separation/alignment/cohesion with neighbor queries) is overkill or too costly for the frame budget.

## Technique

Real boids run an O(n²) neighbor search every frame. For ambient background flocks you rarely need emergent behavior — you need the *look* of a flock. Give each agent its own parametric orbit: a `radius`, angular `speed`, phase `offset`, orbit `centerZ`, and `height`. Advance an angle `a = t * speed + offset` and place the agent on a circle. Spread the random parameters wide so the orbits interleave and the flock reads as organic rather than a marching ring.

Orient each agent along its heading. For a circular orbit the tangent's yaw is `-a + Math.PI/2`, so `rotation.y` follows the direction of travel for free — no `lookAt` needed. Layer a vertical bob (`Math.sin(a * 2)`) and a wing flap (`Math.sin(t * 3 + flap)`) on top so motion isn't a flat 2D circle.

This is O(n), allocation-free, and scales to dozens of agents trivially. One `group.userData.update(t)` drives the whole flock from the tick loop.

## Pattern

```js
function makeFlock(count) {
  const group = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: '#1a0b2e', emissive: '#4a2c7a', side: THREE.DoubleSide })

  const birds = []
  for (let i = 0; i < count; i++) {
    const bird = makeManta(mat)             // body cone + two triangle wings on userData.wings
    bird.scale.setScalar(3 + Math.random() * 3)
    bird.userData = {
      radius: 80 + Math.random() * 160,
      speed: 0.12 + Math.random() * 0.12,
      offset: Math.random() * Math.PI * 2,
      centerZ: -200 - Math.random() * 1000,
      height: 120 + Math.random() * 200,
      flap: Math.random() * Math.PI * 2,
      wings: bird.userData.wings,
    }
    group.add(bird); birds.push(bird)
  }

  group.userData.update = (t) => birds.forEach((b) => {
    const u = b.userData, a = t * u.speed + u.offset
    b.position.set(Math.cos(a) * u.radius, u.height + Math.sin(a * 2) * 18, u.centerZ + Math.sin(a) * u.radius)
    b.rotation.y = -a + Math.PI / 2          // face the direction of travel
    const flap = Math.sin(t * 3 + u.flap) * 0.5
    u.wings[0].rotation.z = flap
    u.wings[1].rotation.z = -flap
  })
  return group
}
```

## Pitfalls

- Identical `speed`/`offset` for every agent makes them stack into one ring — randomize all orbit params widely.
- Get the heading math right: for `(cos a, sin a)` orbits the yaw is `-a + Math.PI/2`; a wrong sign flies the flock backwards.
- This is *not* true boids — there's no collision avoidance, so keep orbits spaced or some agents will overlap.
- Mirror wings with opposite-sign `rotation.z` (`flap` / `-flap`) or the flap looks lopsided.
- Build agents from a single shared material; per-agent materials kill batching.
- Tie animation to elapsed `t`, never frame count, so the flock runs at the same speed across refresh rates.
