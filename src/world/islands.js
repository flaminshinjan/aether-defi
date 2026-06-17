import * as THREE from 'three'

// Floating low-poly islands suspended in the air, each crowned with a soft
// glow — fragments of the world that have broken free and drift gently.
export function createIslands() {
  const group = new THREE.Group()
  const islands = []

  const rockMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3b1d4f'),
    flatShading: true,
    roughness: 0.95,
  })
  const topMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#7c3f86'),
    emissive: new THREE.Color('#9b4bd6'),
    emissiveIntensity: 0.25,
    flatShading: true,
    roughness: 0.7,
  })

  for (let i = 0; i < 10; i++) {
    const island = new THREE.Group()

    const r = 8 + Math.random() * 14
    const baseGeo = new THREE.ConeGeometry(r, r * 2.2, 7, 2)
    deform(baseGeo, 2.2)
    baseGeo.rotateX(Math.PI) // point downward
    const base = new THREE.Mesh(baseGeo, rockMat)
    base.position.y = -r * 0.8
    island.add(base)

    const topGeo = new THREE.SphereGeometry(r, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)
    deform(topGeo, 1.4)
    const top = new THREE.Mesh(topGeo, topMat)
    island.add(top)

    const glow = new THREE.PointLight(0xb86bff, 1.2, 120, 2)
    glow.position.y = r * 0.5
    island.add(glow)

    island.position.set(
      (Math.random() - 0.5) * 560,
      60 + Math.random() * 260,
      -120 - Math.random() * 1300
    )
    const s = 0.7 + Math.random() * 1.4
    island.scale.setScalar(s)
    island.userData.baseY = island.position.y
    island.userData.bob = Math.random() * Math.PI * 2
    island.userData.spin = (Math.random() - 0.5) * 0.04
    group.add(island)
    islands.push(island)
  }

  group.userData.update = (t) => {
    islands.forEach((isl) => {
      isl.position.y = isl.userData.baseY + Math.sin(t * 0.3 + isl.userData.bob) * 7
      isl.rotation.y += isl.userData.spin * 0.01
    })
  }
  return group
}

function deform(geo, amount) {
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.x += (Math.random() - 0.5) * amount
    v.y += (Math.random() - 0.5) * amount
    v.z += (Math.random() - 0.5) * amount
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
}
