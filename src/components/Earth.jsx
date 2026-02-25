import { useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Atmosphere glow using a back-side shader
function AtmosphereGlow() {
  const uniforms = useMemo(
    () => ({
      glowColor:   { value: new THREE.Color(0x3a9fcf) },
      coefficient: { value: 0.45 },
      power:       { value: 3.5 },
    }),
    []
  )

  return (
    <mesh scale={1.18}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3  glowColor;
          uniform float coefficient;
          uniform float power;
          varying vec3  vNormal;
          void main() {
            float intensity = pow(max(0.0, coefficient - dot(vNormal, vec3(0.0, 0.0, 1.0))), power);
            gl_FragColor = vec4(glowColor, intensity);
          }
        `}
        uniforms={uniforms}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

// Fallback sphere shown while textures load or on error
export function EarthFallback() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhongMaterial color="#1a3a5c" specular="#112233" shininess={8} />
      </mesh>
      <AtmosphereGlow />
    </>
  )
}

export default function Earth() {
  const [colorMap, normalMap] = useTexture([
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_normal_2048.jpg',
  ])

  const normalScale = useMemo(() => new THREE.Vector2(0.5, 0.5), [])

  return (
    <>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={normalScale}
          specular={new THREE.Color(0x111111)}
          shininess={8}
        />
      </mesh>
      <AtmosphereGlow />
    </>
  )
}
