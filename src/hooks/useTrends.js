import { useState, useEffect, useCallback, useRef } from 'react'
import { detectCategory } from '../utils/categoryDetector'

const REFRESH_MS = 5 * 60 * 1000   // 5 minutes

function normalize(items) {
  return items.map((item) => ({
    ...item,
    category: item.category || detectCategory(item.title, item.subreddit),
  }))
}

export function useTrends() {
  const [trends,      setTrends]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const intervalRef = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [gtRes, rdRes, hnRes] = await Promise.allSettled([
        fetch('/api/trends').then((r) => { if (!r.ok) throw new Error(r.status); return r.json() }),
        fetch('/api/reddit').then((r) => { if (!r.ok) throw new Error(r.status); return r.json() }),
        fetch('/api/hackernews').then((r) => { if (!r.ok) throw new Error(r.status); return r.json() }),
      ])

      const all = []

      if (gtRes.status === 'fulfilled') {
        all.push(...normalize(gtRes.value.trends ?? []))
      }
      if (rdRes.status === 'fulfilled') {
        all.push(...normalize(rdRes.value.posts ?? []))
      }
      if (hnRes.status === 'fulfilled') {
        all.push(...normalize(hnRes.value.posts ?? []))
      }

      if (all.length === 0) throw new Error('No trend data received')

      // Deduplicate by id
      const seen = new Set()
      const unique = all.filter((t) => {
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })

      setTrends(unique)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[useTrends]', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(intervalRef.current)
  }, [fetchData])

  return { trends, loading, error, lastUpdated, refetch: fetchData }
}
