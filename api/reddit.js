// Vercel Serverless Function — Reddit API proxy
const SUBREDDITS = [
  { name: 'technology',    category: 'tech',          geo: { lat: 37.8, lng: -122.4 } },
  { name: 'worldnews',     category: 'news',          geo: { lat: 48.8, lng:    2.3 } },
  { name: 'science',       category: 'science',       geo: { lat: 42.3, lng:  -71.1 } },
  { name: 'entertainment', category: 'entertainment', geo: { lat: 34.0, lng: -118.2 } },
  { name: 'sports',        category: 'sports',        geo: { lat: 40.7, lng:  -74.0 } },
  { name: 'gaming',        category: 'entertainment', geo: { lat: 47.6, lng: -122.3 } },
  { name: 'artificial',    category: 'tech',          geo: { lat: 37.4, lng: -122.1 } },
  { name: 'space',         category: 'science',       geo: { lat: 28.5, lng:  -80.6 } },
];

const MOCK_POSTS = {
  technology: [
    { title: 'OpenAI releases GPT-5 with multimodal reasoning capabilities', score: 62000 },
    { title: 'Apple Vision Pro teardown reveals impressive custom silicon', score: 38000 },
    { title: 'NVIDIA H200 supply shortage continues despite record demand', score: 27000 },
  ],
  worldnews: [
    { title: 'UN Security Council votes on landmark climate resolution', score: 89000 },
    { title: 'G7 finance ministers agree on new global tax framework', score: 54000 },
    { title: 'Record heatwave sweeps across three continents simultaneously', score: 71000 },
  ],
  science: [
    { title: 'JWST captures atmosphere of Earth-like exoplanet in detail', score: 112000 },
    { title: 'Breakthrough cancer immunotherapy shows 94% remission rate in trial', score: 145000 },
    { title: 'Fusion reactor achieves sustained 10-minute net energy gain', score: 203000 },
  ],
  entertainment: [
    { title: 'Dune: Part Three confirmed with original cast returning', score: 67000 },
    { title: 'Taylor Swift Eras Tour film breaks streaming records', score: 94000 },
    { title: 'Oscars 2024: complete list of nominees announced', score: 48000 },
  ],
  sports: [
    { title: 'Lionel Messi scores hat-trick in Champions League final', score: 134000 },
    { title: 'New world record set in 100m sprint at World Athletics Championships', score: 78000 },
    { title: 'NBA trade deadline: blockbuster deals reshape title race', score: 56000 },
  ],
  gaming: [
    { title: 'GTA VI trailer breaks YouTube record with 100M views in 24h', score: 188000 },
    { title: 'Palworld crosses 10 million players in first week', score: 93000 },
    { title: "Nintendo Switch 2 specs officially confirmed by developer kit leaks", score: 71000 },
  ],
  artificial: [
    { title: 'Anthropic Claude 4 achieves near-human scores on reasoning benchmarks', score: 45000 },
    { title: 'AI-generated drug candidate enters human clinical trials', score: 82000 },
    { title: 'Google DeepMind AlphaFold3 maps entire human proteome', score: 67000 },
  ],
  space: [
    { title: 'SpaceX Starship completes first successful orbital flight', score: 156000 },
    { title: 'NASA Artemis III crew announced for 2026 lunar landing', score: 98000 },
    { title: 'James Webb detects biosignature molecule on K2-18b', score: 231000 },
  ],
};

function getMockPosts(sub) {
  const posts = MOCK_POSTS[sub.name] || MOCK_POSTS.technology;
  return posts.map((post, i) => ({
    id: `reddit-mock-${sub.name}-${i}`,
    title: post.title,
    url: `https://reddit.com/r/${sub.name}`,
    volume: post.score,
    source: 'reddit',
    subreddit: sub.name,
    category: sub.category,
    geo: {
      country: 'US',
      countryName: 'United States',
      lat: sub.geo.lat + (Math.random() - 0.5) * 16,
      lng: sub.geo.lng + (Math.random() - 0.5) * 16,
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

  const fetchPromises = SUBREDDITS.map(async (sub) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(
        `https://www.reddit.com/r/${sub.name}/hot.json?limit=8`,
        {
          headers: {
            'User-Agent': 'TrendGlobe/1.0 (Vercel serverless; open-source visualization)',
            Accept: 'application/json',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const posts = data?.data?.children
        ?.filter((p) => !p.data.stickied && p.data.score > 100)
        .slice(0, 4)
        .map((p) => ({
          id: `reddit-${p.data.id}`,
          title: p.data.title,
          url: `https://reddit.com${p.data.permalink}`,
          volume: p.data.score,
          source: 'reddit',
          subreddit: p.data.subreddit_name_prefixed?.replace('r/', '') || sub.name,
          category: sub.category,
          geo: {
            country: 'US',
            countryName: 'United States',
            lat: sub.geo.lat + (Math.random() - 0.5) * 16,
            lng: sub.geo.lng + (Math.random() - 0.5) * 16,
          },
          thumbnail: p.data.thumbnail !== 'self' ? p.data.thumbnail : null,
          timestamp: new Date(p.data.created_utc * 1000).toISOString(),
        }));

      return posts?.length > 0 ? posts : getMockPosts(sub);
    } catch {
      return getMockPosts(sub);
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  const posts = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  res.status(200).json({ posts, timestamp: new Date().toISOString() });
}
