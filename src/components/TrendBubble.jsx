import { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { latLngToVector3, normalizeBubbleSize, formatVolume } from '../utils/sphereUtils'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../utils/categoryDetector'

// Stable per-bubble seed so pulses are out of phase
let _seed = 0
function useSeed() {
  return useMemo(() => (_seed += 1.3), [])
}

export default function TrendBubble({ trend, selected, onSelect }) {
  const meshRef  = useRef()
  const glowRef  = useRef()
  const [hovered, setHovered] = useState(false)
  const seed = useSeed()

  const position = useMemo(
    () => latLngToVector3(trend.geo.lat, trend.geo.lng, 1.025),
    [trend.geo.lat, trend.geo.lng]
  )

  const baseSize = useMemo(() => normalizeBubbleSize(trend.volume), [trend.volume])
  const color    = useMemo(() => new THREE.Color(CATEGORY_COLORS[trend.category] ?? '#ff6b35'), [trend.category])

  // Pulse + selection scale animation
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    const pulse = 1 + Math.sin(t * 1.8 + seed) * 0.12
    const sel   = selected ? 1.5 : 1.0
    const hov   = hovered  ? 1.3 : 1.0
    const scale = baseSize * pulse * sel * hov
    meshRef.current.scale.setScalar(scale)
    if (glowRef.current) glowRef.current.scale.setScalar(scale * 1.6)
  })

  const handleOver  = useCallback((e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer' }, [])
  const handleOut   = useCallback((e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'    }, [])
  const handleClick = useCallback((e) => { e.stopPropagation(); onSelect(trend) }, [trend, onSelect])

  return (
    <group position={position}>
      {/* Core bubble */}
      <mesh
        ref={meshRef}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1.0 : hovered ? 0.7 : 0.4}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Glow halo (additive blend, depth-write off) */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Tooltip (always-facing HTML) */}
      {(hovered || selected) && (
        <Html
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          zIndexRange={[100, 0]}
        >
          <div className={`bubble-tooltip ${selected ? 'selected' : ''}`}>
            <div
              className="tooltip-category"
              style={{ color: CATEGORY_COLORS[trend.category] }}
            >
              {CATEGORY_LABELS[trend.category] ?? 'Other'} · {trend.source === 'google' ? 'Google Trends' : `r/${trend.subreddit ?? 'reddit'}`}
            </div>
            <div className="tooltip-title">{trend.title}</div>
            <div className="tooltip-volume">
              {trend.source === 'google' ? '🔍' : '⬆'} {formatVolume(trend.volume)}&nbsp;
              {trend.source === 'google' ? 'searches' : 'upvotes'}
            </div>
            <div className="tooltip-geo">📍 {trend.geo.countryName}</div>
          </div>
        </Html>
      )}
    </group>
  )
}
