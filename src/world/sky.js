import * as THREE from 'three'

// A painterly day-cycle sky. The journey runs from deep night → sunrise:
// at the start a pale moon hangs high over a starlit valley; by the end the
// sun crests the horizon and floods the world with warm dawn light.
//   uDay = 0  → night  (moon up, stars out, cold indigo)
//   uDay = 1  → sunrise (sun risen, sky warm gold + lavender, stars gone)
export function createSky() {
  const group = new THREE.Group()

  const uniforms = {
    uTime: { value: 0 },
    uDay: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.25, -0.25, -1).normalize() },
    uMoonDir: { value: new THREE.Vector3(-0.3, 0.5, -1).normalize() },

    // night palette (top → mid → horizon)
    uNightTop: { value: new THREE.Color('#05060f') },
    uNightMid: { value: new THREE.Color('#11183a') },
    uNightLow: { value: new THREE.Color('#243056') },

    // dawn palette
    uDawnTop: { value: new THREE.Color('#314a9e') },
    uDawnMid: { value: new THREE.Color('#d07ba8') },
    uDawnLow: { value: new THREE.Color('#ffd49a') },

    uSunColor: { value: new THREE.Color('#fff1d6') },
    uMoonColor: { value: new THREE.Color('#cfe0ff') },
  }

  const geo = new THREE.SphereGeometry(1000, 64, 40)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform float uTime;
      uniform float uDay;
      uniform vec3 uSunDir;
      uniform vec3 uMoonDir;
      uniform vec3 uNightTop, uNightMid, uNightLow;
      uniform vec3 uDawnTop, uDawnMid, uDawnLow;
      uniform vec3 uSunColor, uMoonColor;

      float hash(vec3 p){ return fract(sin(dot(p, vec3(17.1, 113.5, 57.3))) * 4768.13); }

      void main() {
        vec3 dir = normalize(vDir);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

        // build night + dawn gradients, then cross-fade by time of day
        vec3 night = mix(uNightLow, uNightMid, smoothstep(0.0, 0.5, h));
        night = mix(night, uNightTop, smoothstep(0.45, 1.0, h));

        vec3 dawn = mix(uDawnLow, uDawnMid, smoothstep(0.0, 0.42, h));
        dawn = mix(dawn, uDawnTop, smoothstep(0.4, 1.0, h));

        // warm glow concentrated near the horizon where the sun rises
        float horizonGlow = pow(1.0 - h, 2.2);
        dawn += uDawnLow * horizonGlow * 0.6;

        vec3 col = mix(night, dawn, smoothstep(0.0, 1.0, uDay));

        // ---- Sun (rises and brightens with the day) ----
        vec3 sunDir = normalize(uSunDir);
        float sd = max(dot(dir, sunDir), 0.0);
        float sunDisc = smoothstep(0.9988, 0.9994, sd);
        float sunHalo = pow(sd, 350.0) * 1.6 + pow(sd, 24.0) * 0.45 + pow(sd, 6.0) * 0.12;
        float sunVisible = smoothstep(0.0, 0.35, uDay) * smoothstep(-0.15, 0.05, sunDir.y);
        col += uSunColor * (sunDisc * 2.2 + sunHalo) * sunVisible;

        // ---- Moon (high and bright at night, sinks and fades by dawn) ----
        vec3 moonDir = normalize(uMoonDir);
        float md = max(dot(dir, moonDir), 0.0);
        float moonDisc = smoothstep(0.9992, 0.9996, md);
        float moonHalo = pow(md, 60.0) * 0.35 + pow(md, 8.0) * 0.08;
        float moonVisible = (1.0 - smoothstep(0.4, 0.95, uDay));
        // faint crater shading on the disc
        float crater = 0.85 + 0.15 * hash(floor(dir * 800.0));
        col += uMoonColor * (moonDisc * crater * 1.4 + moonHalo) * moonVisible;

        // ---- Stars (only at night, fading as dawn breaks) ----
        float starField = step(0.9973, hash(floor(dir * 260.0)));
        float twinkle = 0.55 + 0.45 * sin(uTime * 2.0 + hash(floor(dir*260.0)) * 30.0);
        float starVisible = (1.0 - smoothstep(0.0, 0.7, uDay)) * smoothstep(0.2, 0.7, h);
        col += starField * twinkle * starVisible * 0.9;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })

  const dome = new THREE.Mesh(geo, mat)
  group.add(dome)

  group.userData.update = (t) => {
    uniforms.uTime.value = t
  }
  group.userData.uniforms = uniforms

  return group
}
