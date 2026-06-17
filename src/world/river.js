import * as THREE from 'three'

// A glowing river of liquidity flowing down the valley floor.
// Animated emissive bands suggest current and "swaps" rippling through.
export function createRiver() {
  const geo = new THREE.PlaneGeometry(70, 1400, 8, 220)
  geo.rotateX(-Math.PI / 2)

  // gentle meander along the valley
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.x += Math.sin(v.z * 0.012) * 28
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()

  const uniforms = {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color('#46e6ff') },
    uColorB: { value: new THREE.Color('#b06bff') },
    uOpacity: { value: 0.9 },
  }

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uOpacity;

      void main(){
        // flowing current bands
        float flow = sin(vUv.y * 60.0 - uTime * 2.2) * 0.5 + 0.5;
        float flow2 = sin(vUv.y * 18.0 - uTime * 1.1 + vUv.x * 6.0) * 0.5 + 0.5;
        float current = flow * 0.4 + flow2 * 0.6;

        vec3 col = mix(uColorA, uColorB, current);
        col += pow(current, 3.0) * 0.6;

        // soft edges across the width
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float glow = 0.5 + current * 0.6;

        gl_FragColor = vec4(col * glow, edge * uOpacity);
      }
    `,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = -20
  mesh.userData.update = (t) => {
    uniforms.uTime.value = t
  }
  mesh.userData.uniforms = uniforms
  return mesh
}
