import { useState } from 'react'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../utils/categoryDetector'
import { formatVolume } from '../utils/sphereUtils'

function TrendItem({ trend, selected, onSelect }) {
  const color = CATEGORY_COLORS[trend.category] ?? '#ff6b35'
  return (
    <button
      className={`trend-item ${selected ? 'trend-item--selected' : ''}`}
      onClick={() => onSelect(selected ? null : trend)}
      style={{ '--accent': color }}
    >
      <span className="trend-dot" style={{ background: color }} />
      <span className="trend-content">
        <span className="trend-title">{trend.title}</span>
        <span className="trend-meta">
          <span className={`source-badge source-badge--${trend.source}`}>
            {trend.source === 'google' ? '🔍 Google' : `⬆ r/${trend.subreddit ?? 'reddit'}`}
          </span>
          <span className="trend-volume">{formatVolume(trend.volume)}</span>
        </span>
      </span>
    </button>
  )
}

function SelectedDetail({ trend, onClose }) {
  if (!trend) return null
  const color = CATEGORY_COLORS[trend.category] ?? '#ff6b35'
  return (
    <div className="detail-panel" style={{ '--accent': color }}>
      <div className="detail-header">
        <span className="detail-category" style={{ color }}>
          {CATEGORY_ICONS[trend.category]} {CATEGORY_LABELS[trend.category] ?? 'Other'}
        </span>
        <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <h2 className="detail-title">{trend.title}</h2>
      <div className="detail-stats">
        <div className="stat">
          <span className="stat-label">Volume</span>
          <span className="stat-value">{formatVolume(trend.volume)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Source</span>
          <span className="stat-value">
            {trend.source === 'google' ? 'Google Trends' : `Reddit · r/${trend.subreddit ?? 'all'}`}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Region</span>
          <span className="stat-value">📍 {trend.geo.countryName}</span>
        </div>
      </div>
      <a
        className="detail-link"
        href={trend.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ borderColor: color, color }}
      >
        View source ↗
      </a>
    </div>
  )
}

export default function InfoPanel({
  trends,
  loading,
  error,
  lastUpdated,
  activeCategory,
  selectedTrend,
  onTrendSelect,
  onRefresh,
}) {
  const [collapsed, setCollapsed] = useState(false)

  const filtered = activeCategory
    ? trends.filter((t) => t.category === activeCategory)
    : trends

  const sorted = [...filtered].sort((a, b) => b.volume - a.volume)

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <aside className={`info-panel ${collapsed ? 'info-panel--collapsed' : ''}`}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <h1 className="panel-title">Trend Globe</h1>
          {timeStr && <span className="panel-updated">Updated {timeStr}</span>}
        </div>
        <div className="panel-header-right">
          <button
            className="icon-btn"
            onClick={onRefresh}
            title="Refresh"
            disabled={loading}
          >
            {loading ? '⏳' : '↺'}
          </button>
          <button
            className="icon-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Selected trend detail */}
          {selectedTrend && (
            <SelectedDetail trend={selectedTrend} onClose={() => onTrendSelect(null)} />
          )}

          {/* Trend list */}
          <div className="panel-body">
            {error && (
              <div className="panel-error">
                ⚠ {error}
                <button onClick={onRefresh}>Retry</button>
              </div>
            )}

            {loading && trends.length === 0 ? (
              <div className="panel-loading">
                <div className="loading-spinner" />
                <span>Fetching trends…</span>
              </div>
            ) : (
              <>
                <div className="trend-count">
                  {sorted.length} trend{sorted.length !== 1 ? 's' : ''}
                  {activeCategory && ` · ${CATEGORY_LABELS[activeCategory]}`}
                </div>
                <div className="trend-list">
                  {sorted.map((t) => (
                    <TrendItem
                      key={t.id}
                      trend={t}
                      selected={selectedTrend?.id === t.id}
                      onSelect={onTrendSelect}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
