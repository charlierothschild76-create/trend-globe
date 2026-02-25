// Vercel Serverless Function — Google Trends RSS proxy
const GEO_REGIONS = [
  { code: 'US', lat: 38.9,  lng: -77.0,  name: 'United States' },
  { code: 'GB', lat: 51.5,  lng: -0.1,   name: 'United Kingdom' },
  { code: 'DE', lat: 52.5,  lng: 13.4,   name: 'Germany' },
  { code: 'FR', lat: 48.8,  lng: 2.3,    name: 'France' },
  { code: 'JP', lat: 35.7,  lng: 139.7,  name: 'Japan' },
  { code: 'AU', lat: -33.9, lng: 151.2,  name: 'Australia' },
  { code: 'CA', lat: 45.4,  lng: -75.7,  name: 'Canada' },
  { code: 'IN', lat: 28.6,  lng: 77.2,   name: 'India' },
  { code: 'BR', lat: -15.8, lng: -47.9,  name: 'Brazil' },
  { code: 'KR', lat: 37.6,  lng: 126.9,  name: 'South Korea' },
  { code: 'MX', lat: 19.4,  lng: -99.1,  name: 'Mexico' },
  { code: 'ZA', lat: -25.7, lng: 28.2,   name: 'South Africa' },
];

function parseRSS(xml, geo) {
  const trends = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const titleMatch =
      item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
      item.match(/<title>(.*?)<\/title>/);
    const trafficMatch = item.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/);
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    if (!titleMatch) continue;

    const trafficStr = trafficMatch ? trafficMatch[1] : '1,000';
    const volume = parseInt(trafficStr.replace(/[^0-9]/g, '')) || 1000;

    trends.push({
      id: `gt-${geo.code}-${Date.now()}-${trends.length}`,
      title: titleMatch[1].trim(),
      url: linkMatch
        ? linkMatch[1].trim()
        : `https://trends.google.com/trends/explore?geo=${geo.code}`,
      volume,
      source: 'google',
      geo: {
        country: geo.code,
        countryName: geo.name,
        lat: geo.lat + (Math.random() - 0.5) * 6,
        lng: geo.lng + (Math.random() - 0.5) * 6,
      },
      timestamp: new Date().toISOString(),
    });
  }
  return trends.slice(0, 5);
}

const MOCK_TRENDS = {
  US: ['AI Regulation Bill', 'Super Bowl Halftime', 'Tesla Recall', 'Oscar Nominees', 'Fed Rate Decision'],
  GB: ['Premier League Title Race', 'NHS Winter Crisis', 'Spring Budget', 'BAFTA Winners', 'King Charles'],
  DE: ['Bundesliga Meister', 'Wirtschaftsflaute', 'Ampel Koalition', 'Oktoberfest Tickets', 'EV Charging'],
  FR: ['Tour de France Route', 'Grève des Transports', 'Élections Européennes', 'Festival Cannes', 'Champagne Record'],
  JP: ['Cherry Blossom Forecast', 'Nintendo Direct', 'Anime Awards', 'Mount Fuji Hike', 'Yen Exchange Rate'],
  AU: ['Australian Open', 'Great Barrier Reef', 'Sydney Housing Crisis', 'Kangaroo Island Fire', 'Vegemite'],
  CA: ['NHL Trade Deadline', 'Northern Lights Alert', 'Maple Leafs Playoffs', 'Ottawa Protest', 'Poutine Festival'],
  IN: ['IPL Auction 2024', 'Bollywood Box Office', 'India vs Pakistan', 'Diwali Celebration', 'ISRO Mission'],
  BR: ['Carnaval Rio 2024', 'Copa Libertadores Final', 'Amazon Deforestation', 'São Paulo Fashion Week', 'Lula Policy'],
  KR: ['BTS World Tour', 'Samsung Galaxy Launch', 'K-Drama Netflix Hit', 'Seoul Fashion Week', 'K-Pop Awards'],
  MX: ['Liga MX Final', 'Day of the Dead', 'Mexico City Marathon', 'Tequila Export Record', 'AMLO Speech'],
  ZA: ['Rugby World Cup', 'Cape Town Water Crisis', 'Mandela Anniversary', 'Kruger Park Safari', 'Rand Exchange'],
};

function getMockTrends(geo) {
  const titles = MOCK_TRENDS[geo.code] || ['Trending Now', 'Breaking Story', 'Top Search'];
  return titles.map((title, i) => ({
    id: `gt-mock-${geo.code}-${i}`,
    title,
    url: `https://trends.google.com/trends/explore?geo=${geo.code}&q=${encodeURIComponent(title)}`,
    volume: Math.floor(Math.random() * 800000) + 50000,
    source: 'google',
    geo: {
      country: geo.code,
      countryName: geo.name,
      lat: geo.lat + (Math.random() - 0.5) * 8,
      lng: geo.lng + (Math.random() - 0.5) * 8,
    },
    timestamp: new Date().toISOString(),
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const fetchPromises = GEO_REGIONS.map(async (geo) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(
        `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo.code}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TrendGlobe/1.0)',
            Accept: 'application/rss+xml, application/xml, text/xml',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      const parsed = parseRSS(xml, geo);
      return parsed.length > 0 ? parsed : getMockTrends(geo);
    } catch {
      return getMockTrends(geo);
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  const trends = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((t) => t.title);

  res.status(200).json({ trends, timestamp: new Date().toISOString() });
}
