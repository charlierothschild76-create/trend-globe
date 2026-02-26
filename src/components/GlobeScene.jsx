import { Suspense, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Earth, { EarthFallback } from './Earth'
import TrendBubbles from './TrendBubbles'
import Atmosphere from './Atmosphere'

function RotatingGroup({ children, paused }) {
  const groupRef = useRef()
  useFrame((_, delta) => {
    if (groupRef.current && !paused) {
      groupRef.current.rotation.y += delta * 0.04
    }
  })
  return <group ref={groupRef}>{children}</group>
}

export default function GlobeScene({ trends, activeCategory, selectedTrend, onTrendSelect, onHover }) {
  const [interacting, setInteracting] = useState(false)

  return (
    <>
      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 3, 5]}  intensity={1.2} />
      <directionalLight position={[-5, -3, -5]} intensity={0.15} color="#3a5f8a" />

      {/* Deep space background colour */}
      <color attach="background" args={['#030814']} />

      {/* Star field */}
      <Stars radius={80} depth={50} count={6000} factor={4} saturation={0} fade speed={0.6} />

      {/* Globe + bubbles in a single auto-rotating group */}
      <RotatingGroup paused={interacting}>
        <Suspense fallback={<EarthFallback />}>
          <Earth />
        </Suspense>
        <Atmosphere />
        <TrendBubbles
          trends={trends}
          activeCategory={activeCategory}
          selectedTrend={selectedTrend}
          onSelect={onTrendSelect}
          onHover={onHover}
        />
      </RotatingGroup>

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
        minDistance={1.6}
        maxDistance={5.0}
        onStart={() => setInteracting(true)}
        onEnd={()   => setInteracting(false)}
      />

      {/* Post-processing: Bloom makes emissive materials glow */}
      <EffectComposer>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.6}
          luminanceSmoothing={0.8}
          intensity={1.4}
          radius={0.7}
        />
      </EffectComposer>
    </>
  )
}
