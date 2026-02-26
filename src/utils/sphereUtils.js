import * as THREE from 'three'

/**
 * Convert geographic latitude/longitude to a 3D point on a sphere.
 * @param {number} lat  – latitude  in degrees (-90 … +90)
 * @param {number} lng  – longitude in degrees (-180 … +180)
 * @param {number} radius – sphere radius (default 1)
 * @returns {THREE.Vector3}
 */
export function latLngToVector3(lat, lng, radius = 1) {
  const phi   = (90 - lat)  * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  )
}

/**
 * Map a trend volume (search hits / upvotes) to a bubble radius.
 * Uses logarithmic scaling so that very large numbers don't dominate.
 */
export function normalizeBubbleSize(volume, minR = 0.012, maxR = 0.075) {
  const logVol = Math.log10(Math.max(volume, 100))   // clamp at 100
  const logMin = 2   // log10(100)
  const logMax = 6   // log10(1 000 000)
  const t = Math.min((logVol - logMin) / (logMax - logMin), 1)
  return minR + t * (maxR - minR)
}

/** Format a number for display: 1 234 567 → "1.2M", 45 000 → "45K" */
export function formatVolume(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
