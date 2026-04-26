# 📰 PulseNews — Full Stack News Website

A complete, production-ready news website with backend API, admin panel, user auth, comments, and more.

---

## 🗂️ Project Structure

```
pulsenews/
├── backend/
│   ├── middleware/
│   │   └── auth.js           ← JWT auth middleware
│   ├── routes/
│   │   ├── admin.js          ← Admin dashboard API
│   │   ├── auth.js           ← Login / Register API
│   │   ├── categories.js     ← Categories API
│   │   ├── comments.js       ← Comments API
│   │   └── news.js           ← Articles API
│   ├── .env.example          ← Copy this to .env
│   ├── database.js           ← SQLite setup + seed data
│   ├── package.json
│   └── server.js             ← Main Express server
├── frontend/
│   └── public/
│       ├── css/
│       │   └── style.css     ← All styles
│       ├── js/
│       │   └── app.js        ← Full SPA JavaScript
│       └── index.html        ← Main HTML page
├── package.json              ← Root scripts
└── README.md                 ← This file
```

---

## ✅ Features

- 🔴 Breaking news ticker
- 📰 Article listing with categories, search, pagination
- 🔥 Trending page (most viewed)
- 📖 Full article page with rich content
- ❤️ Like & 📑 Save articles
- 💬 Comments (guest + registered)
- 🌙 Dark mode toggle
- 🔐 User registration & login (JWT)
- 🛡️ Admin panel (articles, categories, users, comments, settings)
- 📱 Fully mobile responsive
- ⚡ Fast (SQLite, compression, caching)

---

## 🚀 HOW TO RUN LOCALLY (Step-by-Step)

### Step 1 — Install Node.js
Download from: https://nodejs.org (choose LTS version)
After install, open terminal and verify:
```bash
node --version   # Should show v18 or higher
npm --version
```

### Step 2 — Extract & Setup
```bash
# Extract the zip, then navigate into folder
cd pulsenews

# Go into backend and install packages
cd backend
npm install
```

### Step 3 — Configure Environment
```bash
# In the backend folder, copy .env.example to .env
cp .env.example .env

# Open .env and set your values (optional, defaults work fine)
```

### Step 4 — Start the Server
```bash
# From inside the backend/ folder:
node server.js

# You'll see:
# 🚀 PulseNews running on http://localhost:3000
# 📰 Admin panel: http://localhost:3000/admin.html
```

### Step 5 — Open in Browser
Visit: http://localhost:3000

**Admin Login:**
- Email: `admin@pulsenews.com`
- Password: `Admin@123456`

---

## ☁️ DEPLOY FOR FREE (Step-by-Step)

### Option A — Railway.app (RECOMMENDED — Easiest, Free)

1. Go to https://railway.app and sign up (use GitHub)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Upload your code to GitHub first:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/pulsenews.git
   git push -u origin main
   ```
4. In Railway, select your repo
5. Railway auto-detects Node.js
6. Set these **Environment Variables** in Railway dashboard:
   ```
   PORT=3000
   JWT_SECRET=any_long_random_string_here_abc123xyz789
   NODE_ENV=production
   ADMIN_EMAIL=your@email.com
   ADMIN_PASSWORD=YourSecurePassword123
   ```
7. Set **Root Directory** to `backend` in Railway settings
8. Set **Start Command**: `node server.js`
9. Click Deploy — your site is live in 2 minutes! 🎉

**Your site will be at:** `https://yourproject.up.railway.app`

---

### Option B — Render.com (Also Free)

1. Go to https://render.com → Sign up
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables (same as Railway above)
6. Click **Create Web Service**
7. Free tier spins down after 15 min inactivity (normal)

---

### Option C — Cyclic.sh (Free, No Credit Card)

1. Go to https://cyclic.sh → Login with GitHub
2. Click **"Deploy"** → connect your GitHub repo
3. Set environment variables in dashboard
4. Done!

---

### Option D — VPS (DigitalOcean, Hostinger — ~$4/month)

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repo
git clone https://github.com/YOU/pulsenews.git
cd pulsenews/backend
npm install

# Install PM2 (keeps app running)
npm install -g pm2

# Copy .env.example to .env and edit it
cp .env.example .env
nano .env   # Edit your values

# Start with PM2
pm2 start server.js --name pulsenews
pm2 startup   # Auto-start on reboot
pm2 save

# Install Nginx for domain
sudo apt install nginx
# Configure Nginx to proxy to port 3000
```

---

## 🔑 Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | admin@pulsenews.com |
| Password | Admin@123456 |

**⚠️ Change these in your .env file before deploying!**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/news | List articles |
| GET | /api/news/:slug | Get single article |
| POST | /api/news | Create article (admin) |
| PUT | /api/news/:id | Update article (admin) |
| DELETE | /api/news/:id | Delete article (admin) |
| POST | /api/news/:id/like | Like/unlike article |
| POST | /api/news/:id/save | Save/unsave article |
| GET | /api/categories | List categories |
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| POST | /api/comments | Post comment |
| GET | /api/admin/stats | Dashboard stats (admin) |
| GET | /api/admin/articles | All articles (admin) |
| GET | /api/admin/users | All users (admin) |
| GET | /api/admin/settings | Site settings (admin) |
| PUT | /api/admin/settings | Update settings (admin) |

---

## 🛠️ Customization

### Change Site Name
1. Login as admin → Admin Panel → Settings
2. Change "Site Name" and "Tagline"

### Add Your Logo
Replace the text logo in `frontend/public/index.html` line with an `<img>` tag.

### Add Articles
Login as admin → Admin Panel → Articles → "New Article"

### Change Colors
Edit `frontend/public/css/style.css` — change the `:root` CSS variables at the top.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (SPA) |
| Backend | Node.js + Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (JSON Web Tokens) |
| Styling | Custom CSS with CSS Variables |
| Fonts | Google Fonts (Playfair Display, Source Sans 3) |

---

## 📞 Support

- The database (`news.db`) is created automatically on first run
- All sample articles and categories are seeded automatically
- The admin can write, edit, delete articles from the panel
- No external database needed — SQLite is built-in!
