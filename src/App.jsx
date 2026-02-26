import { useState, useMemo, Suspense, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import GlobeScene from './components/GlobeScene'
import InfoPanel  from './components/InfoPanel'
import Legend     from './components/Legend'
import { useTrends } from './hooks/useTrends'
import { CATEGORY_COLORS, CATEGORY_LABELS } from './utils/categoryDetector'
import { formatVolume } from './utils/sphereUtils'

function HoverTooltip({ tip }) {
  const { trend, x, y } = tip
  const color = CATEGORY_COLORS[trend.category] ?? '#ff6b35'
  // Clamp so tooltip stays within viewport
  const left = Math.min(Math.max(x, 90), window.innerWidth - 90)
  const top  = y > 120 ? y : y + 20  // flip below cursor if near top
  const transform = y > 120 ? 'translate(-50%, calc(-100% - 10px))' : 'translate(-50%, 10px)'
  return (
    <div
      className="bubble-tooltip"
      style={{ position: 'fixed', left, top, transform, pointerEvents: 'none', zIndex: 50 }}
    >
      <div className="tooltip-category" style={{ color }}>
        {CATEGORY_LABELS[trend.category] ?? 'Other'} · {trend.source === 'google' ? 'Google Trends' : `r/${trend.subreddit ?? 'reddit'}`}
      </div>
      <div className="tooltip-title">{trend.title}</div>
      <div className="tooltip-volume">
        {trend.source === 'google' ? '🔍' : '⬆'} {formatVolume(trend.volume)}&nbsp;
        {trend.source === 'google' ? 'searches' : 'upvotes'}
      </div>
      <div className="tooltip-geo">📍 {trend.geo.countryName}</div>
    </div>
  )
}

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
  const [hoveredTip, setHoveredTip] = useState(null) // { trend, x, y }

  const handleHover = useCallback((trend, x, y) => {
    setHoveredTip(trend ? { trend, x, y } : null)
  }, [])

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
            onHover={handleHover}
          />
        </Suspense>
      </Canvas>

      {/* ── Hover Tooltip ──────────────────────────────────────────── */}
      {hoveredTip && (
        <HoverTooltip tip={hoveredTip} />
      )}

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
