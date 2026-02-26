// ── Category detection ───────────────────────────────────────────────────────

const KEYWORDS = {
  tech: [
    'AI', 'GPT', 'OpenAI', 'Anthropic', 'Apple', 'Google', 'Microsoft',
    'Amazon', 'Meta', 'Tesla', 'SpaceX', 'NVIDIA', 'Intel', 'AMD',
    'iPhone', 'Android', 'Samsung', 'Nintendo', 'PlayStation', 'Xbox',
    'Bitcoin', 'Crypto', 'NFT', 'Blockchain', 'Cloud', 'AWS',
    'Software', 'Hardware', 'App', 'Tech', 'Digital', 'Cyber',
    'Robot', 'Machine Learning', 'Neural', 'Algorithm', 'Developer',
    'Startup', 'Venture', 'Silicon Valley', 'Chip', 'Semiconductor',
    'ChatGPT', 'Claude', 'Gemini', 'Copilot', 'LLM',
  ],
  news: [
    'Election', 'President', 'Congress', 'Senate', 'Parliament',
    'Government', 'War', 'Military', 'Conflict', 'NATO', 'UN', 'EU',
    'Ukraine', 'Russia', 'China', 'Gaza', 'Israel', 'Middle East',
    'Biden', 'Trump', 'Policy', 'Law', 'Court', 'Supreme Court',
    'Vote', 'Democracy', 'Economy', 'Inflation', 'Recession', 'Bank',
    'Federal Reserve', 'Strike', 'Protest', 'Riot', 'Shooting',
    'Attack', 'Terrorism', 'Sanction', 'Diplomat', 'Treaty', 'Summit',
    'Immigration', 'Border', 'Refugee', 'Ceasefire', 'Humanitarian',
  ],
  entertainment: [
    'Movie', 'Film', 'Netflix', 'Disney', 'Marvel', 'DC', 'Star Wars',
    'HBO', 'Amazon Prime', 'Streaming', 'Box Office', 'Sequel',
    'Music', 'Album', 'Concert', 'Tour', 'Grammy', 'Oscar', 'Emmy',
    'MTV', 'Billboard', 'Spotify', 'YouTube', 'Podcast',
    'Celebrity', 'Actor', 'Singer', 'Band', 'Rapper', 'Taylor Swift',
    'Beyoncé', 'Drake', 'BTS', 'K-Pop', 'Anime', 'Manga',
    'Fashion', 'Model', 'Runway', 'Award', 'Game Show', 'Reality TV',
    'Trailer', 'Premier', 'Release', 'Dune', 'Barbie', 'Oppenheimer',
  ],
  sports: [
    'Championship', 'World Cup', 'FIFA', 'Olympics', 'Olympic',
    'NBA', 'NFL', 'MLB', 'NHL', 'MLS', 'Premier League', 'La Liga',
    'Champions League', 'Super Bowl', 'Final', 'Playoff',
    'Tennis', 'Grand Slam', 'Wimbledon', 'US Open', 'French Open',
    'Golf', 'PGA', 'NASCAR', 'Formula 1', 'F1', 'MMA', 'UFC', 'Boxing',
    'Soccer', 'Football', 'Basketball', 'Baseball', 'Cricket', 'IPL',
    'Rugby', 'Tour de France', 'Marathon', 'Transfer', 'Messi', 'Ronaldo',
    'LeBron', 'Federer', 'Djokovic', 'Verstappen',
  ],
  science: [
    'NASA', 'ESA', 'CERN', 'Research', 'Study', 'Discovery', 'Breakthrough',
    'Cancer', 'Vaccine', 'Immunotherapy', 'Medicine', 'Drug', 'Clinical Trial',
    'Disease', 'Virus', 'Pandemic', 'DNA', 'Gene', 'Genome', 'Protein',
    'Climate', 'Environment', 'CO2', 'Emissions', 'Renewable', 'Solar',
    'Earthquake', 'Volcano', 'Species', 'Evolution', 'Fossil',
    'Physics', 'Chemistry', 'Biology', 'Quantum', 'Particle',
    'Planet', 'Galaxy', 'Black Hole', 'Dark Matter', 'Telescope',
    'James Webb', 'JWST', 'Fusion', 'Hydrogen', 'Exoplanet', 'Asteroid',
  ],
}

const SUBREDDIT_MAP = {
  technology:    'tech',
  programming:   'tech',
  artificial:    'tech',
  machinelearning:'tech',
  cryptocurrency:'tech',
  worldnews:     'news',
  news:          'news',
  politics:      'news',
  geopolitics:   'news',
  europe:        'news',
  entertainment: 'entertainment',
  movies:        'entertainment',
  television:    'entertainment',
  music:         'entertainment',
  gaming:        'entertainment',
  anime:         'entertainment',
  sports:        'sports',
  nba:           'sports',
  nfl:           'sports',
  soccer:        'sports',
  formula1:      'sports',
  tennis:        'sports',
  science:       'science',
  space:         'science',
  biology:       'science',
  askscience:    'science',
  futurology:    'science',
}

/**
 * Detect the category of a trend from its title and optional subreddit name.
 * @returns {'tech'|'news'|'entertainment'|'sports'|'science'|'other'}
 */
export function detectCategory(title, subreddit = null) {
  if (subreddit) {
    const mapped = SUBREDDIT_MAP[subreddit.toLowerCase()]
    if (mapped) return mapped
  }

  const upper = title.toUpperCase()
  let best = 'other'
  let bestScore = 0

  for (const [cat, keywords] of Object.entries(KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (upper.includes(kw.toUpperCase())) score++
    }
    if (score > bestScore) {
      bestScore = score
      best = cat
    }
  }

  return best
}

// ── Visual configuration ─────────────────────────────────────────────────────

export const CATEGORY_COLORS = {
  tech:          '#00D4FF',   // electric cyan
  news:          '#FF4757',   // hot red
  entertainment: '#FFC312',   // gold
  sports:        '#2ED573',   // lime green
  science:       '#A55EEA',   // violet
  other:         '#FF6B35',   // orange
}

export const CATEGORY_LABELS = {
  tech:          'Technology',
  news:          'News & Politics',
  entertainment: 'Entertainment',
  sports:        'Sports',
  science:       'Science',
  other:         'Other',
}

export const CATEGORY_ICONS = {
  tech:          '⚡',
  news:          '📰',
  entertainment: '🎬',
  sports:        '🏆',
  science:       '🔬',
  other:         '🌐',
}
