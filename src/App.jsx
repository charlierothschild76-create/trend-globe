import { useState, useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import GlobeScene from './components/GlobeScene'
import InfoPanel  from './components/InfoPanel'
import Legend     from './components/Legend'
import { useTrends } from './hooks/useTrends'

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-globe" />
      <p>Connecting to the world…</p>
    </div>
  )
}

export default function App() {
  const { trends, loading, error, lastUpdated, refetch } = useTrends()
  const [activeCategory, setActiveCategory] = useState(null)
  const [selectedTrend,  setSelectedTrend]  = useState(null)

  // Per-category counts for the legend
  const trendCounts = useMemo(() => {
    const counts = { total: trends.length }
    for (const t of trends) {
      counts[t.category] = (counts[t.category] ?? 0) + 1
    }
    return counts
  }, [trends])

  function handleTrendSelect(trend) {
    setSelectedTrend((prev) => (prev?.id === trend?.id ? null : trend))
  }

  function handleCategoryChange(cat) {
    setActiveCategory(cat)
    // Deselect trend if it doesn't belong to new category
    if (cat && selectedTrend && selectedTrend.category !== cat) {
      setSelectedTrend(null)
    }
  }

  return (
    <div className="app">
      {/* ── 3D Canvas ──────────────────────────────────────────────── */}
      <Canvas
        className="globe-canvas"
        camera={{ position: [0, 0.8, 3], fov: 45, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <GlobeScene
            trends={trends}
            activeCategory={activeCategory}
            selectedTrend={selectedTrend}
            onTrendSelect={handleTrendSelect}
          />
        </Suspense>
      </Canvas>

      {/* ── UI Overlay ─────────────────────────────────────────────── */}
      {loading && trends.length === 0 ? (
        <LoadingScreen />
      ) : (
        <>
          <InfoPanel
            trends={trends}
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            activeCategory={activeCategory}
            selectedTrend={selectedTrend}
            onTrendSelect={handleTrendSelect}
            onRefresh={refetch}
          />
          <Legend
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            trendCounts={trendCounts}
          />
        </>
      )}
    </div>
  )
}
