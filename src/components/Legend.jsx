import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../utils/categoryDetector'

const CATEGORIES = Object.keys(CATEGORY_COLORS)

export default function Legend({ activeCategory, onCategoryChange, trendCounts }) {
  return (
    <nav className="legend" aria-label="Category filter">
      <button
        className={`legend-btn ${!activeCategory ? 'legend-btn--active' : ''}`}
        onClick={() => onCategoryChange(null)}
      >
        🌍 All
        {trendCounts?.total != null && (
          <span className="legend-count">{trendCounts.total}</span>
        )}
      </button>

      {CATEGORIES.map((cat) => {
        const color  = CATEGORY_COLORS[cat]
        const active = activeCategory === cat
        const count  = trendCounts?.[cat]
        return (
          <button
            key={cat}
            className={`legend-btn ${active ? 'legend-btn--active' : ''}`}
            style={active ? { '--c': color, background: color + '22', borderColor: color, color } : { '--c': color }}
            onClick={() => onCategoryChange(active ? null : cat)}
          >
            <span className="legend-dot" style={{ background: color }} />
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            {count != null && <span className="legend-count">{count}</span>}
          </button>
        )
      })}
    </nav>
  )
}
