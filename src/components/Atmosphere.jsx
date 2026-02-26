import * as THREE from 'three'

/**
 * Atmospheric glow ring around the globe.
 * Two layers: inner haze + outer corona.
 * Uses AdditiveBlending + toneMapped=false so Bloom picks it up.
 */
export default function Atmosphere() {
  return (
    <group>
      {/* Inner haze — very subtle blue rim */}
      <mesh>
        <sphereGeometry args={[1.015, 48, 48]} />
        <meshBasicMaterial
          color="#2299ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Outer corona — soft glow that Bloom amplifies */}
      <mesh>
        <sphereGeometry args={[1.08, 48, 48]} />
        <meshBasicMaterial
          color="#0066cc"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
