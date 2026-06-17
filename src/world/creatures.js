import * as THREE from 'three'

// Living inhabitants of the world: bioluminescent jellyfish that pulse and
// drift, a flock of manta-like sky creatures, and floating crystal "tokens".
export function createCreatures() {
  const group = new THREE.Group()

  const jellies = []
  for (let i = 0; i < 7; i++) {
    const j = makeJellyfish()
    j.position.set(
      (Math.random() - 0.5) * 320,
      30 + Math.random() * 130,
      -150 - Math.random() * 1100
    )
    const s = 6 + Math.random() * 8
    j.scale.setScalar(s)
    j.userData.phase = Math.random() * Math.PI * 2
    j.userData.driftX = j.position.x
    j.userData.driftY = j.position.y
    j.userData.speed = 0.3 + Math.random() * 0.4
    group.add(j)
    jellies.push(j)
  }

  const flock = makeFlock(14)
  group.add(flock)

  const crystals = []
  for (let i = 0; i < 18; i++) {
    const c = makeCrystal()
    c.position.set(
      (Math.random() - 0.5) * 420,
      20 + Math.random() * 220,
      -100 - Math.random() * 1300
    )
    c.userData.spin = (Math.random() - 0.5) * 0.6
    c.userData.bob = Math.random() * Math.PI * 2
    c.userData.baseY = c.position.y
    group.add(c)
    crystals.push(c)
  }

  group.userData.update = (t) => {
    jellies.forEach((j) => {
      const p = j.userData.phase
      j.position.y = j.userData.driftY + Math.sin(t * j.userData.speed + p) * 10
      j.position.x = j.userData.driftX + Math.sin(t * 0.2 + p) * 14
      // pulse the bell
      const pulse = 1 + Math.sin(t * 1.6 + p) * 0.12
      j.userData.bell.scale.set(pulse, 1 / pulse, pulse)
      j.userData.tentacles.forEach((tn, k) => {
        tn.rotation.x = Math.sin(t * 1.4 + p + k) * 0.25
      })
    })
    crystals.forEach((c) => {
      c.rotation.y += c.userData.spin * 0.01
      c.rotation.x += c.userData.spin * 0.006
      c.position.y = c.userData.baseY + Math.sin(t * 0.6 + c.userData.bob) * 6
    })
    flock.userData.update(t)
  }

  return group
}

function makeJellyfish() {
  const g = new THREE.Group()

  const bellGeo = new THREE.SphereGeometry(1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  const bellMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ff8fd0'),
    emissive: new THREE.Color('#c44bff'),
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.78,
    roughness: 0.3,
    metalness: 0.0,
    side: THREE.DoubleSide,
  })
  const bell = new THREE.Mesh(bellGeo, bellMat)
  g.add(bell)

  const light = new THREE.PointLight(0xff7ad6, 2.2, 90, 2)
  light.position.y = -0.5
  g.add(light)

  const tentacles = []
  const tMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#ffc2f0'),
    transparent: true,
    opacity: 0.55,
  })
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const pts = []
    for (let s = 0; s <= 8; s++) {
      const y = -s * 0.35
      const wob = Math.sin(s * 0.6) * 0.12
      pts.push(new THREE.Vector3(Math.cos(a) * (0.7 + wob), y, Math.sin(a) * (0.7 + wob)))
    }
    const tg = new THREE.BufferGeometry().setFromPoints(pts)
    const line = new THREE.Line(tg, tMat)
    g.add(line)
    tentacles.push(line)
  }

  g.userData.bell = bell
  g.userData.tentacles = tentacles
  return g
}

// A flock of simple manta/bird creatures circling along the path.
function makeFlock(count) {
  const group = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1a0b2e'),
    emissive: new THREE.Color('#4a2c7a'),
    emissiveIntensity: 0.4,
    roughness: 0.6,
    side: THREE.DoubleSide,
  })

  const birds = []
  for (let i = 0; i < count; i++) {
    const bird = makeManta(mat)
    const s = 3 + Math.random() * 3
    bird.scale.setScalar(s)
    bird.userData = {
      radius: 80 + Math.random() * 160,
      speed: 0.12 + Math.random() * 0.12,
      offset: Math.random() * Math.PI * 2,
      centerZ: -200 - Math.random() * 1000,
      height: 120 + Math.random() * 200,
      flap: Math.random() * Math.PI * 2,
      wings: bird.userData.wings,
    }
    group.add(bird)
    birds.push(bird)
  }

  group.userData.update = (t) => {
    birds.forEach((b) => {
      const u = b.userData
      const a = t * u.speed + u.offset
      b.position.set(
        Math.cos(a) * u.radius,
        u.height + Math.sin(a * 2) * 18,
        u.centerZ + Math.sin(a) * u.radius
      )
      b.rotation.y = -a + Math.PI / 2
      const flap = Math.sin(t * 3 + u.flap) * 0.5
      u.wings[0].rotation.z = flap
      u.wings[1].rotation.z = -flap
    })
  }
  return group
}

function makeManta(mat) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.2, 6), mat)
  body.rotation.x = Math.PI / 2
  g.add(body)

  const wingGeo = new THREE.BufferGeometry()
  const verts = new Float32Array([0, 0, 0.6, 2.4, 0, -0.4, 0.2, 0, -0.9])
  wingGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  wingGeo.computeVertexNormals()

  const wL = new THREE.Mesh(wingGeo, mat)
  const wR = new THREE.Mesh(wingGeo.clone(), mat)
  wR.scale.x = -1
  g.add(wL, wR)
  g.userData.wings = [wL, wR]
  return g
}

function makeCrystal() {
  const geo = new THREE.OctahedronGeometry(3.2, 0)
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8be9fd'),
    emissive: new THREE.Color('#3aa0ff'),
    emissiveIntensity: 1.1,
    metalness: 0.4,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9,
    flatShading: true,
  })
  const mesh = new THREE.Mesh(geo, mat)
  const halo = new THREE.PointLight(0x6fd0ff, 1.1, 60, 2)
  mesh.add(halo)
  return mesh
}
