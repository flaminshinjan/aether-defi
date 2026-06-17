import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

import { createSky } from './world/sky.js'
import { createTerrain } from './world/terrain.js'
import { createRiver } from './world/river.js'
import { createAtmosphere } from './world/atmosphere.js'
import { createCreatures } from './world/creatures.js'
import { createIslands } from './world/islands.js'
import { createJourney, STATIONS } from './journey.js'

gsap.registerPlugin(ScrollTrigger)

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const canvas = document.getElementById('world')
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05

const scene = new THREE.Scene()
const fogColor = new THREE.Color('#11183a')
scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.0016)

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 3000)
camera.position.set(0, 130, 230)

// ---------------------------------------------------------------------------
// Lighting — animated across the night → sunrise cycle.
//   key  = the moon at night, becoming the sun at dawn
//   hemi = ambient sky/ground bounce, cool at night, warm at sunrise
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight(0x9fb6ff, 0x140a26, 0.4)
scene.add(hemi)

// the "key" light is repositioned each frame to track moon → sun
const key = new THREE.DirectionalLight(0xcfe0ff, 0.7)
key.position.set(-120, 200, -120)
scene.add(key)

const fill = new THREE.DirectionalLight(0x6f9bff, 0.25)
fill.position.set(120, 60, 200)
scene.add(fill)

// palettes for the moonlit night key and the warm sunrise key
const moonKey = new THREE.Color('#bcd2ff')
const sunKey = new THREE.Color('#ffce8f')
const hemiNight = new THREE.Color('#9fb6ff')
const hemiDawn = new THREE.Color('#ffd9b0')
const groundNight = new THREE.Color('#140a26')
const groundDawn = new THREE.Color('#3a2438')

// ---------------------------------------------------------------------------
// Assemble the world
// ---------------------------------------------------------------------------
const sky = createSky()
const terrain = createTerrain()
const river = createRiver()
const atmosphere = createAtmosphere()
const creatures = createCreatures()
const islands = createIslands()

scene.add(sky, terrain, river, atmosphere, creatures, islands)

const animated = [sky, river, atmosphere, creatures, islands]
const journey = createJourney()

// ---------------------------------------------------------------------------
// Post-processing — soft cinematic bloom so glows truly radiate
// (moon, sun, river current, crystals, fireflies)
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.85, // strength
  0.6, // radius
  0.62 // threshold — only bright pixels bloom
)
composer.addPass(bloom)

// fog palette across the cycle: deep night haze → luminous dawn mist
const fogNight = new THREE.Color('#10163a')
const fogDawn = new THREE.Color('#e9b9a0')

// ---------------------------------------------------------------------------
// Scroll → journey progress (smoothed for buttery camera motion)
// ---------------------------------------------------------------------------
let targetProgress = 0
let progress = 0

ScrollTrigger.create({
  trigger: '#scroll',
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,
  onUpdate: (self) => {
    targetProgress = self.progress
  },
})

// depth gauge + time-of-day HUD
const depthFill = document.getElementById('depth-fill')
const clockTime = document.getElementById('clock-time')
const clockPhase = document.getElementById('clock-phase')
const clockIcon = document.getElementById('clock-icon')

// map day factor [0,1] → a clock reading from 23:45 (midnight) to 06:00 (dawn)
function updateClock(day) {
  const startMin = 23 * 60 + 45 // 23:45
  const endMin = 6 * 60 + 5 // 06:05 next morning
  const span = 24 * 60 - startMin + endMin
  let mins = (startMin + day * span) % (24 * 60)
  const hh = String(Math.floor(mins / 60)).padStart(2, '0')
  const mm = String(Math.floor(mins % 60)).padStart(2, '0')
  clockTime.textContent = `${hh}:${mm}`

  let phase, icon
  if (day < 0.18) [phase, icon] = ['Moonrise', '☾']
  else if (day < 0.45) [phase, icon] = ['Deep night', '☽']
  else if (day < 0.7) [phase, icon] = ['Pre-dawn', '✦']
  else if (day < 0.9) [phase, icon] = ['Daybreak', '☼']
  else [phase, icon] = ['Sunrise', '☀']
  clockPhase.textContent = phase
  clockIcon.textContent = icon
}

// ---------------------------------------------------------------------------
// Panel reveal animations
// ---------------------------------------------------------------------------
gsap.utils.toArray('.panel').forEach((panel) => {
  const inner = panel.querySelector('.panel__inner')
  gsap.from(inner, {
    scrollTrigger: {
      trigger: panel,
      start: 'top 70%',
      end: 'bottom 30%',
      toggleActions: 'play reverse play reverse',
    },
    y: 60,
    opacity: 0,
    filter: 'blur(12px)',
    duration: 1.1,
    ease: 'power3.out',
  })
})

// ---------------------------------------------------------------------------
// Navigation — fly to a station by smooth-scrolling the page
// ---------------------------------------------------------------------------
function scrollToStation(index) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  const p = journey.progressForStation(index)
  window.scrollTo({ top: p * maxScroll, behavior: 'smooth' })
}
document.querySelectorAll('[data-go]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault()
    scrollToStation(parseInt(el.dataset.go, 10))
  })
})

// ---------------------------------------------------------------------------
// Mouse parallax — the world breathes around the cursor
// ---------------------------------------------------------------------------
const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2
  mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2
})

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock()
const _look = new THREE.Vector3()
const _sunDir = new THREE.Vector3()
const _moonDir = new THREE.Vector3()
const skyU = sky.userData.uniforms

function tick() {
  const t = clock.getElapsedTime()

  // ease scroll progress toward the target
  progress += (targetProgress - progress) * 0.06
  mouse.x += (mouse.tx - mouse.x) * 0.05
  mouse.y += (mouse.ty - mouse.y) * 0.05

  const { pos, target, day } = journey.sample(progress)

  // place camera with a gentle parallax sway
  camera.position.lerp(pos, 0.12)
  camera.position.x += mouse.x * 14
  camera.position.y += -mouse.y * 8

  _look.copy(target)
  _look.x += mouse.x * 18
  camera.lookAt(_look)

  // ---- Celestial bodies: sun rises, moon sets ----
  // sun climbs from below the horizon (night) to high in the sky (dawn)
  _sunDir.set(0.24, THREE.MathUtils.lerp(-0.28, 0.42, day), -1).normalize()
  // moon does the opposite — high & framed at night, sinking past the horizon by dawn
  _moonDir.set(-0.2, THREE.MathUtils.lerp(0.46, -0.22, day), -1).normalize()
  skyU.uDay.value = day
  skyU.uSunDir.value.copy(_sunDir)
  skyU.uMoonDir.value.copy(_moonDir)

  // ---- Key light tracks whichever body dominates ----
  // night → cool moonlight from the moon; dawn → warm sun from the horizon
  const keyDir = day < 0.5 ? _moonDir : _sunDir
  key.position.copy(keyDir).multiplyScalar(400)
  key.color.lerpColors(moonKey, sunKey, day)
  key.intensity = THREE.MathUtils.lerp(0.95, 2.2, day)

  hemi.color.lerpColors(hemiNight, hemiDawn, day)
  hemi.groundColor.lerpColors(groundNight, groundDawn, day)
  hemi.intensity = THREE.MathUtils.lerp(0.5, 0.72, day)
  fill.intensity = THREE.MathUtils.lerp(0.35, 0.12, day)

  // ---- Fog & exposure brighten with the dawn ----
  fogColor.lerpColors(fogNight, fogDawn, day)
  scene.fog.color.copy(fogColor)
  scene.fog.density = THREE.MathUtils.lerp(0.0017, 0.0009, day)
  renderer.toneMappingExposure = THREE.MathUtils.lerp(1.02, 1.3, day)

  // ---- Nocturnal glows fade as the sun comes up ----
  const nightGlow = 1.0 - THREE.MathUtils.smoothstep(day, 0.35, 0.9)
  river.userData.uniforms.uOpacity.value = 0.35 + nightGlow * 0.6
  atmosphere.userData.setNight && atmosphere.userData.setNight(nightGlow)

  animated.forEach((o) => o.userData.update && o.userData.update(t))

  // UI: depth gauge + time-of-day
  depthFill.style.height = (progress * 100).toFixed(1) + '%'
  updateClock(day)

  // bloom should be lush at night (glows dominate) and restrained at sunrise
  bloom.strength = THREE.MathUtils.lerp(1.0, 0.55, day)

  composer.render()
  requestAnimationFrame(tick)
}

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.setSize(window.innerWidth, window.innerHeight)
})

// ---------------------------------------------------------------------------
// Boot sequence — warm the renderer, fill the loader, then reveal the world
// ---------------------------------------------------------------------------
function boot() {
  const loader = document.getElementById('loader')
  const loaderFill = document.getElementById('loader-fill')

  // render one frame to compile shaders before revealing
  renderer.compile(scene, camera)

  let p = 0
  const iv = setInterval(() => {
    p = Math.min(100, p + 6 + Math.random() * 12)
    loaderFill.style.width = p + '%'
    if (p >= 100) {
      clearInterval(iv)
      setTimeout(() => {
        loader.classList.add('is-done')
        ScrollTrigger.refresh()
      }, 350)
    }
  }, 90)

  tick()
}

boot()
