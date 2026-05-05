require('dotenv').config();
const connectDB = require('./db');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const categoryRoutes = require('./routes/categories');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ✅ CONNECT DB FIRST
connectDB().then(async () => {
  // Seed data
  await seedData();
});

const seedData = async () => {
  const User = require('./models/User');
  const Category = require('./models/Category');
  const Article = require('./models/Article');
  const bcrypt = require('bcryptjs');

  try {
    // Seed admin user
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@pulsenews.com' });
    if (!adminExists) {
      const hashed = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123456', 10);
      const admin = new User({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@pulsenews.com',
        password: hashed,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user seeded');
    }

    // Seed categories
    const categories = [
      { name: 'Breaking News', color: '#D92B2B', icon: '🔴', slug: 'breaking-news' },
      { name: 'Politics', color: '#1A3FAA', icon: '🏛️', slug: 'politics' },
      { name: 'Technology', color: '#0A7A55', icon: '💻', slug: 'technology' },
      { name: 'Business', color: '#C89B3A', icon: '📈', slug: 'business' },
      { name: 'Sports', color: '#7C3AED', icon: '⚽', slug: 'sports' },
      { name: 'Entertainment', color: '#DB2777', icon: '🎬', slug: 'entertainment' },
      { name: 'Health', color: '#059669', icon: '❤️', slug: 'health' },
      { name: 'World', color: '#2563EB', icon: '🌍', slug: 'world' },
      { name: 'Science', color: '#0891B2', icon: '🔬', slug: 'science' },
    ];

    for (let cat of categories) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (!exists) {
        await new Category(cat).save();
      }
    }
    console.log('✅ Categories seeded');

    // Seed sample articles
    const sampleArticles = [
      {
        title: 'Global Leaders Convene for Emergency Climate Summit in Geneva',
        slug: 'global-leaders-climate-summit-geneva-123456789',
        subheading: '',
        content: `<p>World leaders from more than 50 nations gathered in Geneva on Monday for an emergency climate summit, amid growing concern about accelerating global temperature rises and extreme weather events that have devastated communities across the globe.</p>
<p>The summit, convened by the United Nations Secretary-General, aims to produce binding commitments on carbon emissions reductions, with particular pressure on the world's largest economies to accelerate their transition timelines.</p>
<h2>Key Agenda Points</h2>
<p>Negotiators are working around the clock on three major pillars: emissions reduction targets, climate finance for developing nations, and a new framework for measuring and reporting carbon output.</p>
<p>"The science is unequivocal. We have a narrow window to avoid the worst impacts of climate change, and that window is closing rapidly," said the UN Secretary-General in his opening address.</p>
<p>Developing nations are pushing for wealthy countries to commit to a $500 billion annual climate fund, nearly double the previous target, to help them transition to renewable energy and adapt to climate impacts already being felt.</p>
<h2>Industry Response</h2>
<p>Business leaders accompanying their national delegations have signaled cautious support for stronger targets, provided the transition timelines are realistic and technology transfer agreements are included in the final text.</p>
<p>The summit is expected to run for three days, with a final declaration planned for Wednesday evening.</p>`,
        category_id: 'breaking-news',
        is_featured: true,
        is_breaking: true,
        cover_image: 'https://images.unsplash.com/photo-1532635241-17e820acc59f?w=800&q=80',
        tags: ['climate', 'summit', 'UN', 'environment'],
        views: 15420,
        likes: 0
      },
      // Add more articles as needed
    ];

    for (let art of sampleArticles) {
      const exists = await Article.findOne({ slug: art.slug });
      if (!exists) {
        await new Article(art).save();
      }
    }
    console.log('✅ Sample articles seeded');

  } catch (err) {
    console.log('Seeding error:', err);
  }
};

// ── Middleware ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(morgan('dev'));
app.use(cors({ origin: '*', credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── Static ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// ── Health ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

// ── Frontend ───────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── Error ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});