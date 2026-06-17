import * as THREE from 'three'

// Volumetric-ish atmosphere: soft cloud sprites, drifting fireflies in the
// valley, and a vast field of slow stardust that envelops the whole journey.
export function createAtmosphere() {
  const group = new THREE.Group()

  const fireflies = makeFireflies()
  const stardust = makeStardust()
  const clouds = makeClouds()
  group.add(fireflies, stardust, clouds)

  group.userData.update = (t) => {
    group.children.forEach((c) => c.userData.update && c.userData.update(t))
  }

  // fade nocturnal elements (fireflies, stars) as daylight arrives
  group.userData.setNight = (n) => {
    fireflies.material.uniforms.uNight.value = n
    stardust.material.uniforms.uNight.value = n
  }
  return group
}

// Glowing motes that hover over the liquidity valley.
function makeFireflies() {
  const COUNT = 700
  const positions = new Float32Array(COUNT * 3)
  const seeds = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 260
    positions[i * 3 + 1] = Math.random() * 90 - 10
    positions[i * 3 + 2] = -Math.random() * 1300 + 100
    seeds[i] = Math.random() * 10
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uNight: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      varying float vGlow;
      void main(){
        vec3 p = position;
        p.x += sin(uTime * 0.4 + aSeed * 6.0) * 6.0;
        p.y += sin(uTime * 0.6 + aSeed * 3.0) * 4.0;
        vGlow = 0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 12.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (40.0 + aSeed * 10.0) / -mv.z * 6.0;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vGlow;
      uniform float uNight;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        vec3 col = mix(vec3(1.0, 0.78, 0.42), vec3(0.55, 0.85, 1.0), vGlow);
        gl_FragColor = vec4(col, a * (0.35 + vGlow * 0.65) * uNight);
      }
    `,
  })

  const pts = new THREE.Points(geo, mat)
  pts.userData.update = (t) => (mat.uniforms.uTime.value = t)
  return pts
}

// Distant slow-moving stardust filling the upper world.
function makeStardust() {
  const COUNT = 1400
  const positions = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 1600
    positions[i * 3 + 1] = Math.random() * 700 + 60
    positions[i * 3 + 2] = -Math.random() * 1800 + 200
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uNight: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vTw;
      void main(){
        vec3 p = position;
        vTw = 0.5 + 0.5 * sin(uTime * 1.2 + p.x * 0.02 + p.z * 0.03);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 90.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vTw;
      uniform float uNight;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(0.85, 0.9, 1.0), a * vTw * 0.9 * uNight);
      }
    `,
  })
  const pts = new THREE.Points(geo, mat)
  pts.userData.update = (t) => (mat.uniforms.uTime.value = t)
  return pts
}

// Big soft additive cloud puffs drifting at mid altitude.
function makeClouds() {
  const group = new THREE.Group()
  const tex = makeSoftTexture()
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.22,
    color: new THREE.Color('#d9b6ff'),
    blending: THREE.NormalBlending,
  })

  const clouds = []
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(mat.clone())
    const scale = 220 + Math.random() * 360
    s.scale.set(scale, scale * 0.55, 1)
    s.position.set(
      (Math.random() - 0.5) * 1200,
      90 + Math.random() * 240,
      -Math.random() * 1500 + 150
    )
    s.material.opacity = 0.12 + Math.random() * 0.18
    s.userData.driftSpeed = 4 + Math.random() * 6
    s.userData.baseX = s.position.x
    group.add(s)
    clouds.push(s)
  }

  group.userData.update = (t) => {
    clouds.forEach((c) => {
      c.position.x = c.userData.baseX + Math.sin(t * 0.05 + c.position.z) * c.userData.driftSpeed
    })
  }
  return group
}

function makeSoftTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  return tex
}
