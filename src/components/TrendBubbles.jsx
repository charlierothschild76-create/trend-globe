import { useMemo } from 'react'
import TrendBubble from './TrendBubble'

export default function TrendBubbles({ trends, activeCategory, selectedTrend, onSelect }) {
  const visible = useMemo(
    () => (activeCategory ? trends.filter((t) => t.category === activeCategory) : trends),
    [trends, activeCategory]
  )

  return (
    <>
      {visible.map((trend) => (
        <TrendBubble
          key={trend.id}
          trend={trend}
          selected={selectedTrend?.id === trend.id}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}
