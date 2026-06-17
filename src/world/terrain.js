import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'

// A stylized, low-poly mountain range inspired by digital matte paintings.
// A valley is carved down the centre (the path the camera travels), with
// peaks rising taller toward the "ascent" further down the journey.
export function createTerrain() {
  const group = new THREE.Group()

  const WIDTH = 900
  const DEPTH = 1400
  const SEG_X = 200
  const SEG_Z = 280

  const noise2D = createNoise2D(() => 0.42) // seeded-ish for stable look

  const fbm = (x, z) => {
    let amp = 1
    let freq = 1
    let sum = 0
    let norm = 0
    for (let o = 0; o < 5; o++) {
      sum += amp * noise2D(x * freq, z * freq)
      norm += amp
      amp *= 0.5
      freq *= 2.0
    }
    return sum / norm
  }

  const geo = new THREE.PlaneGeometry(WIDTH, DEPTH, SEG_X, SEG_Z)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position
  const colors = []

  // palette stops, low valley -> high peak
  const cValley = new THREE.Color('#2a1145')
  const cSlope = new THREE.Color('#7b2f6b')
  const cRidge = new THREE.Color('#c85a7c')
  const cPeak = new THREE.Color('#ffd9a8')

  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const x = v.x
    const z = v.z

    // valley carve: floor stays low near x=0, walls rise outward
    const valley = Math.pow(Math.min(Math.abs(x) / 150, 1), 1.7)

    // ridges grow taller toward the far end (the ascent)
    const distFactor = THREE.MathUtils.clamp((DEPTH / 2 - z) / DEPTH, 0.15, 1.2)

    let h = fbm(x * 0.0045 + 10, z * 0.0045) * 0.5 + 0.5
    h *= valley
    h = Math.pow(h, 1.25)

    let elevation = h * 230 * distFactor

    // sharpen a few hero ridgelines
    const ridge = Math.abs(fbm(x * 0.012, z * 0.012 + 40))
    elevation += (1.0 - ridge) * 55 * valley * distFactor

    v.y = elevation - 22
    pos.setXYZ(i, v.x, v.y, v.z)

    // colour by normalized height
    const t = THREE.MathUtils.clamp(elevation / 260, 0, 1)
    const c = new THREE.Color()
    if (t < 0.33) c.lerpColors(cValley, cSlope, t / 0.33)
    else if (t < 0.7) c.lerpColors(cSlope, cRidge, (t - 0.33) / 0.37)
    else c.lerpColors(cRidge, cPeak, (t - 0.7) / 0.3)
    colors.push(c.r, c.g, c.b)
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.92,
    metalness: 0.05,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  group.add(mesh)

  // distant silhouette ranges for parallax depth (painted backdrops)
  const ridgeColors = ['#3a1a52', '#2a1240', '#1d0c30']
  ridgeColors.forEach((col, idx) => {
    const layer = makeSilhouette(col, noise2D)
    layer.position.z = -480 - idx * 230
    layer.position.y = -10 + idx * 26
    layer.scale.setScalar(1 + idx * 0.5)
    group.add(layer)
    layer.userData.parallax = 0.04 + idx * 0.03
  })

  group.userData.update = () => {}
  return group
}

// A flat painterly mountain silhouette band (one mesh, jagged top edge).
function makeSilhouette(colorHex, noise2D) {
  const width = 2200
  const segments = 120
  const baseY = -140
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, baseY)

  for (let i = 0; i <= segments; i++) {
    const x = -width / 2 + (i / segments) * width
    let h = 0
    let amp = 220
    let freq = 0.0016
    for (let o = 0; o < 4; o++) {
      h += amp * Math.abs(noise2D(x * freq, o * 12.3 + 5))
      amp *= 0.5
      freq *= 2.1
    }
    shape.lineTo(x, h)
  }
  shape.lineTo(width / 2, baseY)
  shape.closePath()

  const geo = new THREE.ShapeGeometry(shape, 64)
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: 0.96,
    fog: true,
  })
  return new THREE.Mesh(geo, mat)
}
