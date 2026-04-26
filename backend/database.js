const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'news.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ─────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#D92B2B',
    icon TEXT DEFAULT '📰',
    description TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    category_id TEXT,
    author_id TEXT,
    status TEXT DEFAULT 'published',
    is_featured INTEGER DEFAULT 0,
    is_breaking INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]',
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    user_id TEXT,
    guest_name TEXT,
    guest_email TEXT,
    content TEXT NOT NULL,
    is_approved INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS article_likes (
    user_id TEXT,
    article_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, article_id)
  );

  CREATE TABLE IF NOT EXISTS saved_articles (
    user_id TEXT,
    article_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, article_id)
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
  CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
  CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
  CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
`);

// ── Seed Data ──────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(process.env.ADMIN_EMAIL || 'admin@pulsenews.com');

if (!existingAdmin) {
  const adminId = uuidv4();
  const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123456', 10);

  db.prepare(`INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, 'admin')`)
    .run(adminId, 'Admin', process.env.ADMIN_EMAIL || 'admin@pulsenews.com', hashedPassword);

  // Categories
  const categories = [
    { name: 'Breaking News', color: '#D92B2B', icon: '🔴' },
    { name: 'Politics', color: '#1A3FAA', icon: '🏛️' },
    { name: 'Technology', color: '#0A7A55', icon: '💻' },
    { name: 'Business', color: '#C89B3A', icon: '📈' },
    { name: 'Sports', color: '#7C3AED', icon: '⚽' },
    { name: 'Entertainment', color: '#DB2777', icon: '🎬' },
    { name: 'Health', color: '#059669', icon: '❤️' },
    { name: 'World', color: '#2563EB', icon: '🌍' },
    { name: 'Science', color: '#0891B2', icon: '🔬' },
  ];

  const catIds = {};
  categories.forEach((cat, i) => {
    const id = uuidv4();
    catIds[cat.name] = id;
    db.prepare(`INSERT INTO categories (id, name, slug, color, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, cat.name, slugify(cat.name), cat.color, cat.icon, i);
  });

  // Sample Articles
  const articles = [
    {
      title: 'Global Leaders Convene for Emergency Climate Summit in Geneva',
      excerpt: 'World leaders from 50 nations gather to address the escalating climate crisis with binding agreements expected.',
      content: `<p>World leaders from more than 50 nations gathered in Geneva on Monday for an emergency climate summit, amid growing concern about accelerating global temperature rises and extreme weather events that have devastated communities across the globe.</p>
<p>The summit, convened by the United Nations Secretary-General, aims to produce binding commitments on carbon emissions reductions, with particular pressure on the world's largest economies to accelerate their transition timelines.</p>
<h2>Key Agenda Points</h2>
<p>Negotiators are working around the clock on three major pillars: emissions reduction targets, climate finance for developing nations, and a new framework for measuring and reporting carbon output.</p>
<p>"The science is unequivocal. We have a narrow window to avoid the worst impacts of climate change, and that window is closing rapidly," said the UN Secretary-General in his opening address.</p>
<p>Developing nations are pushing for wealthy countries to commit to a $500 billion annual climate fund, nearly double the previous target, to help them transition to renewable energy and adapt to climate impacts already being felt.</p>
<h2>Industry Response</h2>
<p>Business leaders accompanying their national delegations have signaled cautious support for stronger targets, provided the transition timelines are realistic and technology transfer agreements are included in the final text.</p>
<p>The summit is expected to run for three days, with a final declaration planned for Wednesday evening.</p>`,
      category: 'Breaking News',
      is_featured: 1,
      is_breaking: 1,
      cover_image: 'https://images.unsplash.com/photo-1532635241-17e820acc59f?w=800&q=80',
      tags: ['climate', 'summit', 'UN', 'environment'],
      views: 15420
    },
    {
      title: 'Tech Giants Report Record Q4 Earnings Amid AI Investment Surge',
      excerpt: 'Major technology companies posted their strongest quarterly results in years, driven by booming demand for AI infrastructure.',
      content: `<p>The technology sector's largest companies reported record-breaking fourth-quarter earnings this week, with artificial intelligence infrastructure investment emerging as the primary growth driver across all major platforms.</p>
<p>Combined revenues from the top five technology firms exceeded $400 billion for the quarter, representing a 23% year-over-year increase that exceeded analyst expectations by a significant margin.</p>
<h2>AI as the Core Driver</h2>
<p>Every major company cited AI-related products and services as their fastest-growing segment. Cloud computing divisions, which now serve as the backbone of the AI boom, saw particularly strong performance, with some reporting growth exceeding 35% year-over-year.</p>
<p>Capital expenditure plans announced alongside the results signal even greater investment ahead, with the sector collectively planning to spend over $200 billion on AI infrastructure in the coming fiscal year.</p>
<h2>Market Reaction</h2>
<p>Stock markets responded positively to the earnings releases, with technology indices reaching new all-time highs. Analysts note that while valuations are stretched, strong revenue growth is providing fundamental support.</p>
<p>The results also sparked fresh debate about AI's impact on employment, with companies reporting significant productivity gains while simultaneously announcing large hiring plans for specialized AI talent.</p>`,
      category: 'Technology',
      is_featured: 1,
      is_breaking: 0,
      cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
      tags: ['technology', 'AI', 'earnings', 'business'],
      views: 8930
    },
    {
      title: 'Central Banks Signal Coordinated Rate Cuts as Inflation Cools',
      excerpt: 'Major central banks are preparing synchronized interest rate reductions as inflation data shows sustained cooling across economies.',
      content: `<p>Central banks in the United States, European Union, and United Kingdom signaled this week that they are preparing for a coordinated round of interest rate reductions, following encouraging inflation data that suggests price pressures are sustainably returning to target levels.</p>
<p>The Federal Reserve, European Central Bank, and Bank of England all released statements suggesting that the restrictive monetary policy cycle that began in 2022 may be nearing its end, providing relief to borrowers and businesses worldwide.</p>
<h2>Inflation Data Encouraging</h2>
<p>Consumer price index data released across major economies showed headline inflation has returned to within acceptable ranges of central bank targets for the third consecutive month, building confidence that the trend is durable rather than temporary.</p>
<p>Core inflation, which strips out volatile food and energy prices, has been slower to moderate but is also showing clear downward momentum that policymakers say gives them confidence to begin easing.</p>
<h2>Market Impact</h2>
<p>Bond markets have already priced in multiple rate cuts over the next 12 months, and equity markets responded positively to the central bank signals, with rate-sensitive sectors including real estate and utilities leading gains.</p>
<p>Mortgage rates, which hit multi-decade highs during the tightening cycle, are expected to begin falling meaningfully once official rate cuts commence, potentially providing a significant boost to housing markets.</p>`,
      category: 'Business',
      is_featured: 1,
      is_breaking: 0,
      cover_image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
      tags: ['economy', 'interest rates', 'inflation', 'central bank'],
      views: 6210
    },
    {
      title: 'Breakthrough Cancer Immunotherapy Shows 80% Remission Rate in Trials',
      excerpt: 'A new CAR-T cell therapy has shown unprecedented results in trials for a previously treatment-resistant form of lymphoma.',
      content: `<p>Researchers at a leading cancer research center have announced remarkable results from a Phase 3 clinical trial of a next-generation CAR-T cell therapy, showing an 80% complete remission rate in patients with diffuse large B-cell lymphoma that had previously failed at least two lines of treatment.</p>
<p>The results, published in the New England Journal of Medicine, represent a potential paradigm shift in the treatment of aggressive blood cancers and have generated enormous excitement across the oncology community.</p>
<h2>How the Therapy Works</h2>
<p>The treatment involves extracting a patient's own T-cells, genetically engineering them to recognize and attack cancer cells, and reinfusing them into the patient. This latest iteration includes several novel modifications that dramatically improve the therapy's persistence in the body and reduce the risk of severe side effects.</p>
<p>Previous generations of CAR-T therapies showed remission rates of approximately 40-50% in similar patient populations, making this advance highly significant.</p>
<h2>Path to Approval</h2>
<p>The therapy's developer has announced it will seek expedited regulatory approval in multiple markets, and regulators have already indicated the application will receive priority review given the unmet medical need.</p>
<p>If approved, the therapy is expected to be available at major cancer centers within 18 months, though cost and manufacturing capacity remain significant challenges to broad access.</p>`,
      category: 'Health',
      is_featured: 0,
      is_breaking: 1,
      cover_image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80',
      tags: ['cancer', 'health', 'medicine', 'science'],
      views: 12750
    },
    {
      title: 'Space Agency Confirms Water Ice Deposits Near Lunar South Pole',
      excerpt: 'New data from lunar orbiters provides definitive confirmation of substantial water ice deposits that could support future missions.',
      content: `<p>Space agencies have jointly announced definitive confirmation of substantial water ice deposits near the lunar south pole, a discovery that significantly enhances prospects for sustained human presence on the Moon and potential future missions to Mars.</p>
<p>The confirmation comes from a combination of radar data, neutron spectrometer readings, and direct sample analysis, providing multiple independent lines of evidence that end decades of scientific debate about the presence and quantity of water on the Moon.</p>
<h2>Significance for Exploration</h2>
<p>Water ice is a critical resource for future lunar exploration because it can be extracted and split into hydrogen and oxygen, providing both drinking water for astronauts and rocket propellant for missions deeper into the solar system.</p>
<p>Estimates suggest the deposits contain hundreds of millions of tonnes of ice, far more than previously confirmed, distributed across permanently shadowed craters where temperatures never rise above minus 170 degrees Celsius.</p>
<h2>Next Steps</h2>
<p>Multiple missions planned for the next three years will focus on characterizing the deposits in greater detail and testing extraction technologies. The first crewed missions to the lunar south pole are planned to establish the infrastructure needed for long-term operations.</p>
<p>International cooperation on these missions has been strengthened by the new discovery, with agencies from multiple countries announcing expanded collaboration agreements.</p>`,
      category: 'Science',
      is_featured: 0,
      is_breaking: 0,
      cover_image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
      tags: ['space', 'moon', 'science', 'NASA'],
      views: 9840
    },
    {
      title: 'Champions League Final: Dramatic Comeback Stuns Defending Champions',
      excerpt: 'An incredible second-half performance saw the underdogs complete a historic comeback to claim European football\'s biggest prize.',
      content: `<p>In what is already being called one of the greatest nights in Champions League history, the underdogs staged a stunning second-half comeback to defeat the defending champions 4-3 after trailing 3-0 at halftime, claiming their first European title in a breathtaking final.</p>
<p>The match, played in front of 90,000 spectators, saw the game transformed by the introduction of two substitutes at halftime, who combined for three goals as the crowd witnessed something scarcely believable unfold before them.</p>
<h2>Match Report</h2>
<p>The defending champions had appeared on course for a comfortable victory after a dominant first half, with their star striker completing a hat-trick in just 38 minutes to seemingly put the result beyond doubt.</p>
<p>But the second half was a completely different story. Three goals in 12 minutes from the 55th to 67th minute turned the game on its head, sending their supporters into delirium and stunning the previously dominant side.</p>
<p>The decisive goal came in the 88th minute from a free-kick that deflected off the wall and looped over the goalkeeper, sparking wild scenes of celebration that lasted long into the night.</p>
<h2>Reaction</h2>
<p>The victorious manager, visibly emotional at the final whistle, said: "These players are heroes. What they did tonight is something that belongs to history. We believed when nobody else did."</p>`,
      category: 'Sports',
      is_featured: 0,
      is_breaking: 0,
      cover_image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      tags: ['football', 'champions league', 'sports'],
      views: 22100
    },
    {
      title: 'Global Semiconductor Shortage Eases as New Fabs Come Online',
      excerpt: 'The chip supply crisis that disrupted industries worldwide is finally easing as massive investment in new manufacturing capacity begins paying off.',
      content: `<p>The global semiconductor shortage that disrupted automotive production, consumer electronics, and industrial equipment for several years has finally begun to ease substantially, as billions of dollars in new manufacturing capacity comes online across Asia, Europe, and North America.</p>
<p>Industry analysts report that lead times for most chip categories have returned to pre-shortage levels, while spot market prices have normalized after reaching extraordinary premiums during the crisis period.</p>
<h2>New Capacity Coming Online</h2>
<p>The easing reflects massive investment decisions made during the height of the shortage, when governments and corporations committed unprecedented sums to expand domestic chip manufacturing capabilities. Dozens of new facilities have entered production or are approaching completion.</p>
<p>The investments were accelerated by government subsidies in multiple countries, reflecting a consensus that semiconductor supply chains are a matter of national security as well as economic competitiveness.</p>
<h2>Industry Outlook</h2>
<p>While the immediate shortage has eased, demand for cutting-edge chips continues to accelerate, driven by AI applications that require enormous quantities of specialized processors. The most advanced chips, produced on the smallest manufacturing nodes, remain in high demand with supply constraints persisting.</p>
<p>Analysts caution that the industry cycle means that current oversupply in some segments could create price pressures, but structural demand growth from AI is expected to absorb excess capacity relatively quickly.</p>`,
      category: 'Business',
      is_featured: 0,
      is_breaking: 0,
      cover_image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&q=80',
      tags: ['semiconductors', 'technology', 'supply chain'],
      views: 5430
    },
    {
      title: 'Award Season Kicks Off with Surprise Wins and Record Viewership',
      excerpt: 'This year\'s ceremony delivered unexpected victories, emotional speeches, and the highest TV ratings in a decade.',
      content: `<p>This year's major awards ceremony delivered one of the most memorable evenings in recent memory, featuring surprise wins for independent productions, emotional moments that dominated social media, and ratings that represent the highest viewership in a decade.</p>
<p>The evening's biggest surprise came when a low-budget independent film swept four of the top categories, defeating the heavily-favored studio productions that had dominated the awards season campaign.</p>
<h2>Notable Wins</h2>
<p>The best performance award went to a veteran actor who had been nominated numerous times without winning, prompting a standing ovation and an emotional speech about perseverance that became the most-shared clip of the evening.</p>
<p>The documentary category produced perhaps the most charged moment of the night, with the winning filmmakers using their platform to highlight the real-world situation their film documents.</p>
<h2>Production Highlights</h2>
<p>The ceremony itself received praise for its pacing and production values, with the host drawing strong reviews for walking a delicate line between humor and respect for the occasion.</p>
<p>Viewership figures showed the broadcast attracted 28 million viewers in the domestic market alone, with international streaming numbers still being compiled but expected to set new records.</p>`,
      category: 'Entertainment',
      is_featured: 0,
      is_breaking: 0,
      cover_image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
      tags: ['awards', 'entertainment', 'film', 'television'],
      views: 18900
    },
  ];

  articles.forEach(article => {
    const id = uuidv4();
    const catId = catIds[article.category];
    db.prepare(`
      INSERT INTO articles (id, title, slug, excerpt, content, cover_image, category_id, author_id, is_featured, is_breaking, views, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, article.title, slugify(article.title), article.excerpt, article.content,
      article.cover_image, catId, adminId, article.is_featured, article.is_breaking,
      article.views, JSON.stringify(article.tags)
    );
  });

  // Settings
  const settings = [
    ['site_name', 'PulseNews'],
    ['site_tagline', 'Truth. Speed. Depth.'],
    ['site_logo', ''],
    ['articles_per_page', '12'],
    ['allow_comments', 'true'],
    ['require_comment_approval', 'false'],
    ['social_twitter', 'https://twitter.com'],
    ['social_facebook', 'https://facebook.com'],
    ['social_instagram', 'https://instagram.com'],
  ];
  const insertSetting = db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)');
  settings.forEach(([key, val]) => insertSetting.run(key, val));

  console.log('✅ Database seeded with sample data');
}

module.exports = db;
