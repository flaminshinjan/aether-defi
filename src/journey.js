import * as THREE from 'three'

// The cinematic path through the world. Each station maps to a narrative panel.
// We interpolate the camera along smooth Catmull-Rom curves so motion never
// snaps — it glides, banks and rises like a drone flying through the ecosystem.
export const STATIONS = 5

const cameraPoints = [
  new THREE.Vector3(0, 130, 230), // 0 origin — high overlook
  new THREE.Vector3(-34, 24, -210), // 1 valley floor, skimming the river
  new THREE.Vector3(46, 96, -640), // 2 ascent — banking up the slope
  new THREE.Vector3(-20, 360, -1040), // 3 cosmos — above the clouds
  new THREE.Vector3(0, 470, -1360), // 4 finale — adrift in the open sky
]

const targetPoints = [
  new THREE.Vector3(0, 40, -260),
  new THREE.Vector3(10, 30, -560),
  new THREE.Vector3(-10, 180, -1000),
  new THREE.Vector3(0, 420, -1500),
  new THREE.Vector3(0, 520, -1800),
]

// time-of-day per station (0 = deep moonlit night → 1 = full sunrise).
// The world brightens as you descend the journey: moon sets, sun rises.
const dayAt = [0.0, 0.12, 0.45, 0.82, 1.0]

export function createJourney() {
  const camCurve = new THREE.CatmullRomCurve3(cameraPoints, false, 'catmullrom', 0.4)
  const tgtCurve = new THREE.CatmullRomCurve3(targetPoints, false, 'catmullrom', 0.4)

  const _pos = new THREE.Vector3()
  const _tgt = new THREE.Vector3()

  // sample the path at normalized progress p in [0,1]
  function sample(p) {
    p = THREE.MathUtils.clamp(p, 0, 1)
    camCurve.getPoint(p, _pos)
    tgtCurve.getPoint(p, _tgt)

    // interpolate time-of-day across station segments
    const seg = p * (STATIONS - 1)
    const i = Math.min(Math.floor(seg), STATIONS - 2)
    const f = seg - i
    const day = THREE.MathUtils.lerp(dayAt[i], dayAt[i + 1], f)

    return { pos: _pos, target: _tgt, day }
  }

  // progress value [0,1] for a given station index
  function progressForStation(index) {
    return THREE.MathUtils.clamp(index / (STATIONS - 1), 0, 1)
  }

  return { sample, progressForStation }
}
