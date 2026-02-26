// ── Hacker News API proxy ────────────────────────────────────────────────────
// Firebase Realtime Database — no auth required
// Geo is derived from article domain / TLD

const CACHE_TTL = 5 * 60 * 1000

// Domain → geo mapping (major news orgs + tech sites)
const DOMAIN_GEO = {
  'bbc.co.uk':           { country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng: -0.1  },
  'bbc.com':             { country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng: -0.1  },
  'theguardian.com':     { country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng: -0.1  },
  'reuters.com':         { country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng: -0.1  },
  'economist.com':       { country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng: -0.1  },
  'ft.com':              { country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng: -0.1  },
  'nature.com':          { country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng: -0.1  },
  'spiegel.de':          { country: 'DE', countryName: 'Germany',        lat: 52.5, lng: 13.4  },
  'zeit.de':             { country: 'DE', countryName: 'Germany',        lat: 52.5, lng: 13.4  },
  'heise.de':            { country: 'DE', countryName: 'Germany',        lat: 52.5, lng: 13.4  },
  'lemonde.fr':          { country: 'FR', countryName: 'France',         lat: 48.9, lng:  2.3  },
  'lefigaro.fr':         { country: 'FR', countryName: 'France',         lat: 48.9, lng:  2.3  },
  'asahi.com':           { country: 'JP', countryName: 'Japan',          lat: 35.7, lng: 139.7 },
  'nhk.or.jp':           { country: 'JP', countryName: 'Japan',          lat: 35.7, lng: 139.7 },
  'thehindu.com':        { country: 'IN', countryName: 'India',          lat: 28.6, lng: 77.2  },
  'ndtv.com':            { country: 'IN', countryName: 'India',          lat: 28.6, lng: 77.2  },
  'smh.com.au':          { country: 'AU', countryName: 'Australia',      lat: -33.9, lng: 151.2},
  'abc.net.au':          { country: 'AU', countryName: 'Australia',      lat: -33.9, lng: 151.2},
  'globo.com':           { country: 'BR', countryName: 'Brazil',         lat: -23.5, lng: -46.6},
  'nytimes.com':         { country: 'US', countryName: 'United States',  lat: 40.7, lng: -74.0 },
  'washingtonpost.com':  { country: 'US', countryName: 'United States',  lat: 38.9, lng: -77.0 },
  'wsj.com':             { country: 'US', countryName: 'United States',  lat: 40.7, lng: -74.0 },
  'bloomberg.com':       { country: 'US', countryName: 'United States',  lat: 40.7, lng: -74.0 },
  'theatlantic.com':     { country: 'US', countryName: 'United States',  lat: 40.7, lng: -74.0 },
  'techcrunch.com':      { country: 'US', countryName: 'United States',  lat: 37.7, lng: -122.4},
  'wired.com':           { country: 'US', countryName: 'United States',  lat: 37.7, lng: -122.4},
  'arstechnica.com':     { country: 'US', countryName: 'United States',  lat: 35.5, lng: -97.5 },
  'theverge.com':        { country: 'US', countryName: 'United States',  lat: 40.7, lng: -74.0 },
  'engadget.com':        { country: 'US', countryName: 'United States',  lat: 40.7, lng: -74.0 },
  'github.com':          { country: 'US', countryName: 'United States',  lat: 37.7, lng: -122.4},
  'arxiv.org':           { country: 'US', countryName: 'United States',  lat: 42.4, lng: -71.1 },
  'mit.edu':             { country: 'US', countryName: 'United States',  lat: 42.4, lng: -71.1 },
  'science.org':         { country: 'US', countryName: 'United States',  lat: 38.9, lng: -77.0 },
}

// Fallback tech-hub geo pool (weighted towards US)
const TECH_HUBS = [
  { country: 'US', countryName: 'United States', lat: 37.7, lng: -122.4 }, // SF
  { country: 'US', countryName: 'United States', lat: 37.7, lng: -122.4 }, // SF (double weight)
  { country: 'US', countryName: 'United States', lat: 40.7, lng:  -74.0 }, // NYC
  { country: 'US', countryName: 'United States', lat: 47.6, lng: -122.3 }, // Seattle
  { country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng:   -0.1 },
  { country: 'DE', countryName: 'Germany',         lat: 52.5, lng:   13.4 },
  { country: 'JP', countryName: 'Japan',            lat: 35.7, lng:  139.7 },
  { country: 'CA', countryName: 'Canada',           lat: 43.7, lng:  -79.4 },
  { country: 'AU', countryName: 'Australia',        lat: -33.9, lng: 151.2 },
  { country: 'IN', countryName: 'India',            lat: 28.6, lng:   77.2 },
  { country: 'FR', countryName: 'France',           lat: 48.9, lng:    2.3 },
  { country: 'NL', countryName: 'Netherlands',      lat: 52.4, lng:    4.9 },
  { country: 'SE', countryName: 'Sweden',           lat: 59.3, lng:   18.1 },
  { country: 'SG', countryName: 'Singapore',        lat:  1.3, lng:  103.8 },
]

function jitter(geo) {
  return { ...geo, lat: geo.lat + (Math.random() - 0.5) * 5, lng: geo.lng + (Math.random() - 0.5) * 5 }
}

function geoForUrl(url) {
  if (!url) return jitter(TECH_HUBS[Math.floor(Math.random() * TECH_HUBS.length)])
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (DOMAIN_GEO[host]) return jitter(DOMAIN_GEO[host])
    // TLD hints
    if (host.endsWith('.co.uk') || host.endsWith('.uk')) return jitter({ country: 'GB', countryName: 'United Kingdom', lat: 51.5, lng: -0.1 })
    if (host.endsWith('.de')) return jitter({ country: 'DE', countryName: 'Germany',        lat: 52.5, lng: 13.4  })
    if (host.endsWith('.fr')) return jitter({ country: 'FR', countryName: 'France',         lat: 48.9, lng:  2.3  })
    if (host.endsWith('.au')) return jitter({ country: 'AU', countryName: 'Australia',      lat: -33.9, lng: 151.2 })
    if (host.endsWith('.jp')) return jitter({ country: 'JP', countryName: 'Japan',          lat: 35.7, lng: 139.7 })
    if (host.endsWith('.in')) return jitter({ country: 'IN', countryName: 'India',          lat: 28.6, lng: 77.2  })
    if (host.endsWith('.ca')) return jitter({ country: 'CA', countryName: 'Canada',         lat: 43.7, lng: -79.4 })
    if (host.endsWith('.cn')) return jitter({ country: 'CN', countryName: 'China',          lat: 39.9, lng: 116.4 })
    if (host.endsWith('.br')) return jitter({ country: 'BR', countryName: 'Brazil',         lat: -23.5, lng: -46.6 })
    if (host.endsWith('.nl')) return jitter({ country: 'NL', countryName: 'Netherlands',    lat: 52.4, lng:  4.9  })
    if (host.endsWith('.se')) return jitter({ country: 'SE', countryName: 'Sweden',         lat: 59.3, lng: 18.1  })
    if (host.endsWith('.ru')) return jitter({ country: 'RU', countryName: 'Russia',         lat: 55.7, lng: 37.6  })
    if (host.endsWith('.kr')) return jitter({ country: 'KR', countryName: 'South Korea',    lat: 37.6, lng: 127.0 })
    if (host.endsWith('.il')) return jitter({ country: 'IL', countryName: 'Israel',         lat: 32.1, lng: 34.8  })
  } catch (_) {}
  return jitter(TECH_HUBS[Math.floor(Math.random() * TECH_HUBS.length)])
}

let cache = null
let cacheTime = 0

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify(cache))
  }

  try {
    // Fetch top 30 story IDs
    const idsRes = await fetch(
      'https://hacker-news.firebaseio.com/v2/topstories.json',
      { signal: AbortSignal.timeout(6000) }
    )
    const ids = await idsRes.json()
    const top = ids.slice(0, 25)

    // Fetch each story in parallel
    const stories = await Promise.all(
      top.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v2/item/${id}.json`, {
          signal: AbortSignal.timeout(4000),
        })
          .then((r) => r.json())
          .catch(() => null)
      )
    )

    const posts = stories
      .filter((s) => s && s.type === 'story' && s.title && s.score >= 10)
      .map((s) => ({
        id:        `hn-${s.id}`,
        title:     s.title,
        url:       s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
        volume:    s.score,
        source:    'hackernews',
        geo:       geoForUrl(s.url),
        timestamp: new Date(s.time * 1000).toISOString(),
      }))

    const result = { posts }
    cache = result
    cacheTime = Date.now()

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
    res.end(JSON.stringify(result))
  } catch (err) {
    console.error('[hackernews]', err)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ posts: [] }))
  }
}
