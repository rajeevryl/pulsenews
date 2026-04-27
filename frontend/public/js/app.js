/* ── PulseNews Frontend App ─────────────────────────────────────────────── */

const API = 'https://pulsenews-1td9.onrender.com/api';
let state = {
  user: null,
  token: localStorage.getItem('pn_token'),
  categories: [],
  settings: {},
  currentPage: 'home',
  searchTimeout: null,
};

// ── Bootstrap ────────────────────────────────────────────────────────────
async function init() {
  setupDate();
  await loadSettings();
  await loadCategories();
  setupTheme();
  if (state.token) await loadCurrentUser();
  handleRoute();
  window.addEventListener('popstate', handleRoute);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-avatar-btn') && !e.target.closest('.user-dropdown')) {
      document.getElementById('userDropdown').style.display = 'none';
    }
  });
}

function setupDate() {
  const d = new Date();
  document.getElementById('currentDate').textContent =
    d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadSettings() {
  try {
    const r = await fetch(`${API}/admin/settings`);
    if (r.ok) {
      state.settings = await r.json();
      const name = state.settings.site_name || 'PulseNews';
      document.title = name + ' — Live & Breaking';
      if (state.settings.site_tagline) document.getElementById('logoTagline').textContent = state.settings.site_tagline;
      document.getElementById('footerCopy').textContent = `© ${new Date().getFullYear()} ${name}. All rights reserved.`;
      renderSocialLinks();
    }
  } catch {}
}

function renderSocialLinks() {
  const el = document.getElementById('footerSocial');
  const links = [
    { key: 'social_twitter', icon: '𝕏' },
    { key: 'social_facebook', icon: 'f' },
    { key: 'social_instagram', icon: '📷' },
  ];
  el.innerHTML = links.filter(l => state.settings[l.key]).map(l =>
    `<a href="${state.settings[l.key]}" target="_blank" class="social-link">${l.icon}</a>`
  ).join('');
}

async function loadCategories() {
  try {
    const r = await fetch(`${API}/categories`);
    state.categories = await r.json();
    renderCategoryNav();
    renderFooterCategories();
  } catch {}
}

function renderCategoryNav() {
  document.getElementById('categoryNav').innerHTML = state.categories.map(c =>
    `<button class="nav-link" onclick="navigate('category','${c.slug}')" data-cat="${c.slug}">
      ${c.icon} ${c.name}
    </button>`
  ).join('');
}

function renderFooterCategories() {
  document.getElementById('footerCategories').innerHTML = state.categories.slice(0, 6).map(c =>
    `<li><a onclick="navigate('category','${c.slug}')">${c.icon} ${c.name}</a></li>`
  ).join('');
}

async function loadCurrentUser() {
  try {
    const r = await apiFetch('/auth/me');
    if (r.ok) {
      state.user = await r.json();
      updateAuthUI();
      await loadBreakingTicker();
    }
  } catch {}
}

function updateAuthUI() {
  const authBtns = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  if (state.user) {
    authBtns.style.display = 'none';
    userMenu.style.display = 'flex';
    const initial = (state.user.name || 'U')[0].toUpperCase();
    document.getElementById('avatarCircle').textContent = initial;
    document.getElementById('dropAvatarCircle').textContent = initial;
    document.getElementById('dropUserName').textContent = state.user.name;
    document.getElementById('dropUserEmail').textContent = state.user.email;
    if (state.user.role === 'admin') document.getElementById('adminLink').style.display = 'block';
  } else {
    authBtns.style.display = 'flex';
    userMenu.style.display = 'none';
  }
}

// ── Routing ──────────────────────────────────────────────────────────────
function handleRoute() {
  const hash = location.hash.replace('#', '') || 'home';
  const [page, ...params] = hash.split('/');
  navigate(page, ...params, true);
}

function navigate(page, param = '', fromPopstate = false) {
  if (!fromPopstate) {
    const hash = param ? `#${page}/${param}` : `#${page}`;
    history.pushState({}, '', hash);
  }
  state.currentPage = page;
  updateActiveNav(page, param);
  const main = document.getElementById('mainContent');
  main.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  switch (page) {
    case 'home': renderHomePage(); break;
    case 'category': renderCategoryPage(param); break;
    case 'article': renderArticlePage(param); break;
    case 'trending': renderTrendingPage(); break;
    case 'search': renderSearchPage(param); break;
    case 'saved': renderSavedPage(); break;
    case 'profile': renderProfilePage(); break;
    case 'admin': renderAdminPage(); break;
    default: renderHomePage();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('userDropdown').style.display = 'none';
}

function updateActiveNav(page, param) {
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
  if (page === 'home') document.querySelector('[data-nav="home"]')?.classList.add('active');
  if (page === 'category') document.querySelector(`[data-cat="${param}"]`)?.classList.add('active');
}

// ── Theme ─────────────────────────────────────────────────────────────────
function setupTheme() {
  const saved = localStorage.getItem('pn_theme') || 'light';
  applyTheme(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('pn_theme', next);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (theme === 'dark') {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
}

// ── API Helper ────────────────────────────────────────────────────────────
function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  return fetch(API + path, { ...options, headers });
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ── Search ────────────────────────────────────────────────────────────────
function toggleSearch() {
  const overlay = document.getElementById('searchOverlay');
  const isHidden = overlay.style.display === 'none';
  overlay.style.display = isHidden ? 'block' : 'none';
  if (isHidden) document.getElementById('searchInput').focus();
  else { document.getElementById('searchResults').innerHTML = ''; document.getElementById('searchInput').value = ''; }
}

function debounceSearch(val) {
  clearTimeout(state.searchTimeout);
  if (!val.trim()) { document.getElementById('searchResults').innerHTML = ''; return; }
  state.searchTimeout = setTimeout(() => doSearch(val), 350);
}

async function doSearch(query) {
  const r = await fetch(`${API}/news?search=${encodeURIComponent(query)}&limit=8`);
  const data = await r.json();
  const el = document.getElementById('searchResults');
  if (!data.articles?.length) {
    el.innerHTML = `<div class="empty-state" style="padding:24px"><p>No results for "${query}"</p></div>`;
    return;
  }
  el.innerHTML = data.articles.map(a => `
    <div class="search-result-item" onclick="toggleSearch(); navigate('article','${a.slug}')">
      ${a.cover_image ? `<img src="${a.cover_image}" class="search-result-img" alt="" onerror="this.style.display='none'">` : ''}
      <div>
        <div class="search-result-title">${a.title}</div>
        <div class="search-result-meta">${a.category_icon || ''} ${a.category_name || 'Uncategorized'} &nbsp;·&nbsp; ${timeAgo(a.published_at)}</div>
      </div>
    </div>`).join('');
}

// ── Breaking Ticker ────────────────────────────────────────────────────────
async function loadBreakingTicker() {
  try {
    const r = await fetch(`${API}/news?breaking=true&limit=6`);
    const data = await r.json();
    if (!data.articles?.length) return;
    const items = data.articles.map(a =>
      `<span class="ticker-item" onclick="navigate('article','${a.slug}')">${a.title}</span><span class="ticker-dot">◆</span>`
    ).join('');
    const track = document.getElementById('tickerTrack');
    track.innerHTML = items + items; // doubled for seamless loop
  } catch {}
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────
async function renderHomePage() {
  try {
    const [featuredRes, latestRes, breakingRes] = await Promise.all([
      fetch(`${API}/news?featured=true&limit=4`),
      fetch(`${API}/news?limit=9&page=1`),
      fetch(`${API}/news?breaking=true&limit=3`),
    ]);
    const [featuredData, latestData, breakingData] = await Promise.all([
      featuredRes.json(), latestRes.json(), breakingRes.json()
    ]);
    const featured = featuredData.articles || [];
    const latest = latestData.articles || [];
    const breaking = breakingData.articles || [];

    await loadBreakingTicker();

    document.getElementById('mainContent').innerHTML = `
      ${featured.length >= 2 ? renderHeroGrid(featured) : ''}
      <div class="two-col">
        <div>
          ${breaking.length ? `
            <div class="section-header">
              <div class="section-title">🔴 Breaking News</div>
            </div>
            <div class="card-grid" style="grid-template-columns:1fr">
              ${breaking.map(a => renderListCard(a)).join('')}
            </div>
          ` : ''}
          <div class="section-header">
            <div class="section-title">Latest Stories</div>
            <div class="section-link" onclick="navigate('trending')">View all →</div>
          </div>
          <div class="card-grid">
            ${latest.map(a => renderCard(a)).join('')}
          </div>
          ${renderPagination(latestData.pagination, 'home')}
        </div>
        <aside class="sidebar">
          ${renderTrendingWidget()}
          ${renderCategoryWidget()}
        </aside>
      </div>
    `;
    setTimeout(loadSidebarTrending, 100);
  } catch (e) {
    document.getElementById('mainContent').innerHTML = renderError('Failed to load articles. Please try again.');
  }
}

function renderHeroGrid(featured) {
  const main = featured[0];
  const subs = featured.slice(1, 3);
  return `
    <div class="hero-grid">
      <div class="hero-main" onclick="navigate('article','${main.slug}')">
        <img src="${main.cover_image || ''}" alt="${main.title}" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'">
        <div class="hero-main-overlay">
          <div>${main.is_breaking ? '<span class="badge badge-breaking">🔴 Breaking</span>' : ''} <span class="badge badge-cat" style="background:${main.category_color || '#D92B2B'}">${main.category_icon || ''} ${main.category_name || ''}</span></div>
          <h2>${main.title}</h2>
          <p>${main.excerpt || ''}</p>
          <div style="display:flex;gap:12px;margin-top:10px;color:rgba(255,255,255,0.65);font-size:12px">
            <span>By ${main.author_name || 'Editorial'}</span>
            <span>·</span><span>${timeAgo(main.published_at)}</span>
            <span>·</span><span>👁 ${formatNum(main.views)}</span>
          </div>
        </div>
      </div>
      <div class="hero-sidebar">
        ${subs.map(a => `
          <div class="hero-sidebar-item" onclick="navigate('article','${a.slug}')">
            <img src="${a.cover_image || ''}" alt="" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&q=60'">
            <div>
              <span class="badge" style="background:${a.category_color || '#D92B2B'};color:#fff;margin-bottom:6px">${a.category_icon || ''} ${a.category_name || ''}</span>
              <h3>${a.title}</h3>
              <p style="font-size:12px;color:var(--ink-light);margin-top:4px">${timeAgo(a.published_at)} · 👁 ${formatNum(a.views)}</p>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderCard(a) {
  return `
    <article class="card" onclick="navigate('article','${a.slug}')">
      <div class="card-img-wrap">
        ${a.cover_image
          ? `<img class="card-img" src="${a.cover_image}" alt="${a.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=card-placeholder>📰</div>'">`
          : `<div class="card-placeholder">📰</div>`}
      </div>
      <div class="card-body">
        <div class="card-meta">
          ${a.is_breaking ? '<span class="badge badge-breaking">🔴 Breaking</span>' : ''}
          <span class="badge badge-cat" style="background:${a.category_color || '#D92B2B'}">${a.category_icon || ''} ${a.category_name || 'News'}</span>
        </div>
        <h2 class="card-title">${a.title}</h2>
        <p class="card-excerpt">${a.excerpt || ''}</p>
        <div class="card-footer">
          <span>By ${a.author_name || 'Editorial'} · ${timeAgo(a.published_at)}</span>
          <div class="card-stats">
            <span class="stat-item">👁 ${formatNum(a.views)}</span>
            <span class="stat-item">❤️ ${a.likes || 0}</span>
          </div>
        </div>
      </div>
    </article>`;
}

function renderListCard(a) {
  return `
    <article class="article-list-item" onclick="navigate('article','${a.slug}')">
      ${a.cover_image ? `<img src="${a.cover_image}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
      <div class="article-list-body">
        <div class="card-meta" style="margin-bottom:6px">
          ${a.is_breaking ? '<span class="badge badge-breaking">🔴 Breaking</span>' : ''}
          <span class="badge badge-cat" style="background:${a.category_color || '#D92B2B'}">${a.category_icon || ''} ${a.category_name || ''}</span>
        </div>
        <div class="article-list-title">${a.title}</div>
        <div class="article-list-meta">
          <span>By ${a.author_name || 'Editorial'}</span>
          <span>${timeAgo(a.published_at)}</span>
          <span>👁 ${formatNum(a.views)}</span>
        </div>
      </div>
    </article>`;
}

function renderTrendingWidget() {
  return `
    <div class="sidebar-widget">
      <h3>🔥 Trending Now</h3>
      <div id="trendingWidget"><div class="loading"><div class="spinner"></div></div></div>
    </div>`;
}

async function loadSidebarTrending() {
  try {
    const r = await fetch(`${API}/news?sort=popular&limit=5`);
    const data = await r.json();
    const el = document.getElementById('trendingWidget');
    if (!el) return;
    el.innerHTML = (data.articles || []).map((a, i) => `
      <div class="article-list-item" onclick="navigate('article','${a.slug}')" style="align-items:center">
        <div class="rank-num">${i + 1}</div>
        <div>
          <div class="article-list-title" style="font-size:14px">${a.title}</div>
          <div class="article-list-meta"><span>👁 ${formatNum(a.views)}</span></div>
        </div>
      </div>`).join('');
  } catch {}
}

function renderCategoryWidget() {
  return `
    <div class="sidebar-widget">
      <h3>📂 Browse Categories</h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${state.categories.map(c => `
          <button onclick="navigate('category','${c.slug}')" class="tag" style="background:${c.color}15;color:${c.color};border:1px solid ${c.color}30">
            ${c.icon} ${c.name}
          </button>`).join('')}
      </div>
    </div>`;
}

// ── CATEGORY PAGE ─────────────────────────────────────────────────────────
async function renderCategoryPage(slug, page = 1) {
  const cat = state.categories.find(c => c.slug === slug);
  try {
    const r = await fetch(`${API}/news?category=${slug}&limit=12&page=${page}`);
    const data = await r.json();
    const articles = data.articles || [];
    document.getElementById('mainContent').innerHTML = `
      <div style="background:${cat?.color || '#D92B2B'}18;border:1px solid ${cat?.color || '#D92B2B'}33;border-radius:var(--radius-lg);padding:28px;margin-bottom:32px;display:flex;align-items:center;gap:16px">
        <div style="font-size:48px">${cat?.icon || '📰'}</div>
        <div>
          <h1 style="font-family:var(--heading);font-size:32px;font-weight:900">${cat?.name || slug}</h1>
          <p style="color:var(--ink-light)">${data.pagination?.total || 0} articles · All stories from this section</p>
        </div>
      </div>
      <div class="section-header">
        <div class="section-title">Latest in ${cat?.name || slug}</div>
        <div style="display:flex;gap:8px">
          <select onchange="sortCategoryPage('${slug}',this.value)" class="btn btn-ghost btn-sm" style="padding:6px 10px">
            <option value="newest">Newest</option>
            <option value="popular">Most Read</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      ${articles.length ? `<div class="card-grid">${articles.map(a => renderCard(a)).join('')}</div>` : `<div class="empty-state"><div class="empty-icon">📰</div><h3>No articles yet</h3><p>Check back soon for stories in this category.</p></div>`}
      ${renderPagination(data.pagination, 'category', slug)}
    `;
  } catch {
    document.getElementById('mainContent').innerHTML = renderError('Could not load category.');
  }
}

function sortCategoryPage(slug, sort) {
  navigate('category', slug);
}

// ── ARTICLE PAGE ──────────────────────────────────────────────────────────
async function renderArticlePage(slug) {
  try {
    const r = await apiFetch(`/news/${slug}`);
    if (!r.ok) throw new Error('Not found');
    const a = await r.json();
    const readTime = Math.ceil((a.content?.replace(/<[^>]+>/g, '').split(' ').length || 0) / 200);

    document.title = a.title + ' — PulseNews';

    document.getElementById('mainContent').innerHTML = `
      <div class="two-col">
        <article>
          <div class="breadcrumb">
            <span onclick="navigate('home')">Home</span>
            <span class="breadcrumb-sep">›</span>
            <span onclick="navigate('category','${a.category_slug}')">${a.category_icon || ''} ${a.category_name || 'News'}</span>
            <span class="breadcrumb-sep">›</span>
            <span style="color:var(--ink-light);cursor:default">${a.title.substring(0, 40)}...</span>
          </div>
          <div class="article-header">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
              ${a.is_breaking ? '<span class="badge badge-breaking">🔴 Breaking News</span>' : ''}
              <span class="badge badge-cat" style="background:${a.category_color || '#D92B2B'}">${a.category_icon || ''} ${a.category_name || 'News'}</span>
              <span class="badge badge-ghost">📖 ${readTime} min read</span>
            </div>
            <h1 class="article-title">${a.title}</h1>
            ${a.excerpt ? `<p style="font-size:19px;color:var(--ink-light);margin-top:12px;font-style:italic">${a.excerpt}</p>` : ''}
            <div class="article-meta-bar">
              <div class="article-author">
                <div class="author-avatar">${(a.author_name || 'E')[0].toUpperCase()}</div>
                <div>
                  <div class="author-name">By ${a.author_name || 'Editorial Team'}</div>
                  <div class="author-date">${formatDate(a.published_at)}</div>
                </div>
              </div>
              <div class="card-stats" style="margin-left:auto">
                <span class="stat-item">👁 ${formatNum(a.views)}</span>
                <span class="stat-item">❤️ <span id="likeCount">${a.likes || 0}</span></span>
                <span class="stat-item">💬 ${(a.comments || []).length}</span>
              </div>
            </div>
          </div>

          ${a.cover_image ? `<img src="${a.cover_image}" class="article-hero-img" alt="${a.title}" onerror="this.style.display='none'">` : ''}

${a.video ? `
  <div 
    style="position:relative;margin:20px 0;cursor:pointer"
    onclick="playVideo(this, '${a.video}')"
  >
    <img 
      src="https://img.youtube.com/vi/${getVideoId(a.video)}/hqdefault.jpg"
      style="width:100%;border-radius:8px"
    >

    <div style="
      position:absolute;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      font-size:60px;
      color:white;
    ">▶</div>
  </div>
` : ''}          <div class="article-body">${a.content || ''}</div>

          ${(a.tags || []).length ? `
            <div class="tag-cloud">
              ${(a.tags).map(t => `<span class="tag" onclick="navigate('search','${t}')">#${t}</span>`).join('')}
            </div>` : ''}

          <div class="divider"></div>
          <div class="article-actions">
            <button class="btn ${a.liked_by_user ? 'btn-primary' : 'btn-ghost'}" id="likeBtn" onclick="toggleLike('${a.slug}')">
              ❤️ ${a.liked_by_user ? 'Liked' : 'Like'} · <span id="likeCountBtn">${a.likes || 0}</span>
            </button>
            <button class="btn ${a.saved_by_user ? 'btn-success' : 'btn-ghost'}" id="saveBtn" onclick="toggleSave('${a.slug}')">
              ${a.saved_by_user ? '✅ Saved' : '📑 Save Article'}
            </button>
            <button class="btn btn-ghost" onclick="shareArticle('${a.title}')">
              📤 Share
            </button>
          </div>

          <div class="divider"></div>
          <div class="comments-section">
            <h2 style="font-family:var(--heading);font-size:24px;margin-bottom:20px">💬 Discussion (${(a.comments || []).length})</h2>
            ${renderCommentForm(a.slug)}
            <div id="commentsList">
              ${(a.comments || []).length ? a.comments.map(c => renderComment(c)).join('') : '<p style="color:var(--ink-light);text-align:center;padding:24px">No comments yet. Be the first!</p>'}
            </div>
          </div>
        </article>

        <aside class="sidebar">
          ${a.related?.length ? `
            <div class="sidebar-widget">
              <h3>📌 Related Articles</h3>
              ${a.related.map(r => renderMiniCard(r)).join('')}
            </div>` : ''}
          ${renderCategoryWidget()}
        </aside>
      </div>
    `;
  } catch (e) {
    document.getElementById('mainContent').innerHTML = renderError('Article not found.');
  }
}

function renderMiniCard(a) {
  return `
    <div onclick="navigate('article','${a.slug}')" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity='1'">
      ${a.cover_image ? `<img src="${a.cover_image}" style="width:70px;height:52px;object-fit:cover;border-radius:4px;flex-shrink:0" onerror="this.style.display='none'">` : ''}
      <div>
        <div style="font-size:13px;font-weight:600;line-height:1.3">${a.title}</div>
        <div style="font-size:11px;color:var(--ink-light);margin-top:3px">${timeAgo(a.published_at)}</div>
      </div>
    </div>`;
}

function renderCommentForm(articleId) {
  if (state.user) {
    return `
      <div class="comment-form">
        <h3 style="font-family:var(--heading);font-size:18px;margin-bottom:16px">Leave a Comment</h3>
        <div class="form-group">
          <textarea id="commentText" rows="3" placeholder="Share your thoughts..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="submitComment('${articleId}')">Post Comment</button>
      </div>`;
  }
  return `
    <div class="comment-form">
      <h3 style="font-family:var(--heading);font-size:18px;margin-bottom:16px">Leave a Comment</h3>
      <div class="form-row">
        <div class="form-group">
          <input type="text" id="guestName" placeholder="Your name *">
        </div>
        <div class="form-group">
          <input type="email" id="guestEmail" placeholder="Email (optional)">
        </div>
      </div>
      <div class="form-group">
        <textarea id="commentText" rows="3" placeholder="Share your thoughts..."></textarea>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="btn btn-primary" onclick="submitComment('${articleId}')">Post Comment</button>
        <button class="btn btn-ghost btn-sm" onclick="showModal('loginModal')">Sign in for more features</button>
      </div>
    </div>`;
}

function renderComment(c) {
  const name = c.user_name || c.guest_name || 'Anonymous';
  const initial = name[0].toUpperCase();
  return `
    <div class="comment">
      <div class="comment-header">
        <div class="comment-avatar">${initial}</div>
        <div>
          <div class="comment-author">${name}</div>
          <div class="comment-date">${formatDate(c.created_at)}</div>
        </div>
      </div>
      <div class="comment-body">${escapeHtml(c.content)}</div>
    </div>`;
}

async function submitComment(articleId) {
  const content = document.getElementById('commentText')?.value?.trim();
  if (!content) return showToast('Please write a comment', 'error');
  const body = { article_id: articleId, content };
  if (!state.user) {
    const name = document.getElementById('guestName')?.value?.trim();
    if (!name) return showToast('Please enter your name', 'error');
    body.guest_name = name;
    body.guest_email = document.getElementById('guestEmail')?.value?.trim();
  }
  try {
    const r = await apiFetch('/comments', { method: 'POST', body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) return showToast(data.error || 'Failed', 'error');
    showToast('Comment posted!', 'success');
    document.getElementById('commentText').value = '';
    navigate('article', location.hash.split('/')[1]);
  } catch { showToast('Error posting comment', 'error'); }
}

async function toggleLike(id) {
  if (!state.user) return showModal('loginModal');
  try {
    const r = await apiFetch(`/news/${id}/like`, { method: 'POST' });
    const data = await r.json();
    const btn = document.getElementById('likeBtn');
    const count = document.getElementById('likeCountBtn');
    const current = parseInt(count.textContent) || 0;
    if (data.liked) {
      btn.className = 'btn btn-primary';
      btn.innerHTML = `❤️ Liked · <span id="likeCountBtn">${current + 1}</span>`;
    } else {
      btn.className = 'btn btn-ghost';
      btn.innerHTML = `❤️ Like · <span id="likeCountBtn">${Math.max(0, current - 1)}</span>`;
    }
  } catch { showToast('Please try again', 'error'); }
}

async function toggleSave(id) {
  if (!state.user) return showModal('loginModal');
  try {
    const r = await apiFetch(`/news/${id}/save`, { method: 'POST' });
    const data = await r.json();
    const btn = document.getElementById('saveBtn');
    btn.textContent = data.saved ? '✅ Saved' : '📑 Save Article';
    btn.className = data.saved ? 'btn btn-success' : 'btn btn-ghost';
    showToast(data.saved ? 'Article saved!' : 'Removed from saved', 'success');
  } catch {}
}

function shareArticle(title) {
  if (navigator.share) {
    navigator.share({ title, url: location.href });
  } else {
    navigator.clipboard.writeText(location.href).then(() => showToast('Link copied!', 'success'));
  }
}

// ── TRENDING PAGE ─────────────────────────────────────────────────────────
async function renderTrendingPage() {
  try {
    const r = await fetch(`${API}/news?sort=popular&limit=20`);
    const data = await r.json();
    const articles = data.articles || [];
    document.getElementById('mainContent').innerHTML = `
      <div class="trending-hero">
        <div class="trending-icon">🔥</div>
        <div>
          <h1>Trending Now</h1>
          <p style="color:rgba(255,255,255,0.7);margin-top:6px">The most-read stories right now</p>
        </div>
      </div>
      <div class="two-col">
        <div>
          <div class="article-list">
            ${articles.map((a, i) => `
              <div class="article-list-item" onclick="navigate('article','${a.slug}')">
                <div class="rank-num" style="color:${i < 3 ? 'var(--red)' : 'var(--paper-dark)'}">${i + 1}</div>
                ${a.cover_image ? `<img src="${a.cover_image}" alt="" style="width:100px;height:72px;object-fit:cover;border-radius:var(--radius)" onerror="this.style.display='none'">` : ''}
                <div class="article-list-body">
                  <div class="card-meta" style="margin-bottom:4px">
                    <span class="badge badge-cat" style="background:${a.category_color || '#D92B2B'}">${a.category_icon || ''} ${a.category_name || ''}</span>
                  </div>
                  <div class="article-list-title">${a.title}</div>
                  <div class="article-list-meta">
                    <span>👁 ${formatNum(a.views)} views</span>
                    <span>❤️ ${a.likes || 0} likes</span>
                    <span>${timeAgo(a.published_at)}</span>
                  </div>
                </div>
              </div>`).join('')}
          </div>
        </div>
        <aside class="sidebar">
          ${renderCategoryWidget()}
        </aside>
      </div>
    `;
  } catch {
    document.getElementById('mainContent').innerHTML = renderError('Could not load trending articles.');
  }
}

// ── SAVED PAGE ────────────────────────────────────────────────────────────
async function renderSavedPage() {
  if (!state.user) { showModal('loginModal'); navigate('home'); return; }
  try {
    const r = await apiFetch('/news/user/saved');
    const articles = await r.json();
    document.getElementById('mainContent').innerHTML = `
      <div class="section-header"><div class="section-title">📑 Saved Articles</div></div>
      ${articles.length
        ? `<div class="card-grid">${articles.map(a => renderCard(a)).join('')}</div>`
        : `<div class="empty-state"><div class="empty-icon">📑</div><h3>No saved articles</h3><p>Click the Save button on any article to read it later.</p></div>`}
    `;
  } catch {
    document.getElementById('mainContent').innerHTML = renderError('Could not load saved articles.');
  }
}

// ── PROFILE PAGE ──────────────────────────────────────────────────────────
function renderProfilePage() {
  if (!state.user) { showModal('loginModal'); navigate('home'); return; }
  const u = state.user;
  document.getElementById('mainContent').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar-lg">${(u.name || 'U')[0].toUpperCase()}</div>
      <div>
        <h1 style="font-family:var(--heading);font-size:28px">${u.name}</h1>
        <p style="color:var(--ink-light)">${u.email}</p>
        <div style="display:flex;gap:16px;margin-top:10px;font-size:13px;color:var(--ink-light)">
          <span>📑 ${u.saved_count || 0} saved articles</span>
          <span>🏷️ ${u.role === 'admin' ? 'Administrator' : 'Reader'}</span>
        </div>
      </div>
    </div>
    <div class="two-col">
      <div>
        <div class="sidebar-widget">
          <h3 style="font-family:var(--heading);font-size:20px;margin-bottom:20px">Edit Profile</h3>
          <form onsubmit="saveProfile(event)">
            <div class="form-group"><label>Full Name</label><input type="text" id="profName" value="${u.name}"></div>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </form>
        </div>
        <div class="sidebar-widget" style="margin-top:24px">
          <h3 style="font-family:var(--heading);font-size:20px;margin-bottom:20px">Change Password</h3>
          <form onsubmit="changePassword(event)">
            <div class="form-group"><label>Current Password</label><input type="password" id="currPass" placeholder="Current password"></div>
            <div class="form-group"><label>New Password</label><input type="password" id="newPass" placeholder="New password (min 6 chars)" minlength="6"></div>
            <button type="submit" class="btn btn-primary">Update Password</button>
          </form>
        </div>
      </div>
      <aside class="sidebar">
        <div class="sidebar-widget">
          <h3>Quick Links</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button onclick="navigate('saved')" class="btn btn-ghost" style="justify-content:flex-start">📑 Saved Articles</button>
            ${u.role === 'admin' ? `<button onclick="navigate('admin')" class="btn btn-ghost" style="justify-content:flex-start">🛡️ Admin Panel</button>` : ''}
            <button onclick="logout()" class="btn btn-ghost" style="justify-content:flex-start;color:var(--red)">🚪 Sign Out</button>
          </div>
        </div>
      </aside>
    </div>
  `;
}

async function saveProfile(e) {
  e.preventDefault();
  const name = document.getElementById('profName').value.trim();
  const r = await apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify({ name }) });
  if (r.ok) { state.user.name = name; updateAuthUI(); showToast('Profile updated!', 'success'); }
  else showToast('Update failed', 'error');
}

async function changePassword(e) {
  e.preventDefault();
  const current = document.getElementById('currPass').value;
  const newPassword = document.getElementById('newPass').value;
  const r = await apiFetch('/auth/password', { method: 'PUT', body: JSON.stringify({ current, newPassword }) });
  const data = await r.json();
  if (r.ok) { showToast('Password changed!', 'success'); document.getElementById('currPass').value = ''; document.getElementById('newPass').value = ''; }
  else showToast(data.error || 'Failed', 'error');
}

// ── ADMIN PAGE ────────────────────────────────────────────────────────────
async function renderAdminPage(section = 'dashboard') {
  if (!state.user || state.user.role !== 'admin') { showToast('Admin access required', 'error'); navigate('home'); return; }
  document.getElementById('mainContent').innerHTML = `
    <div class="admin-layout">
      <div class="admin-sidebar">
        <h3>Admin Panel</h3>
        ${[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'articles', label: '📰 Articles' },
          { id: 'categories', label: '📂 Categories' },
          { id: 'comments', label: '💬 Comments' },
          { id: 'users', label: '👤 Users' },
          { id: 'settings', label: '⚙️ Settings' },
        ].map(s => `<div class="admin-nav-item ${section === s.id ? 'active' : ''}" onclick="renderAdminPage('${s.id}')">${s.label}</div>`).join('')}
      </div>
      <div class="admin-content" id="adminContent">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>`;

  const el = document.getElementById('adminContent');
  switch (section) {
    case 'dashboard': await renderAdminDashboard(el); break;
    case 'articles': await renderAdminArticles(el); break;
    case 'categories': await renderAdminCategories(el); break;
    case 'comments': await renderAdminComments(el); break;
    case 'users': await renderAdminUsers(el); break;
    case 'settings': await renderAdminSettings(el); break;
  }
}

async function renderAdminDashboard(el) {
  const r = await apiFetch('/admin/stats');
  const s = await r.json();
  el.innerHTML = `
    <h2 style="font-family:var(--heading);font-size:24px;margin-bottom:20px">Dashboard</h2>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-num">${s.totalArticles}</div><div class="stat-label">Total Articles</div></div>
      <div class="stat-card"><div class="stat-num">${s.publishedArticles}</div><div class="stat-label">Published</div></div>
      <div class="stat-card"><div class="stat-num">${s.totalUsers}</div><div class="stat-label">Users</div></div>
      <div class="stat-card"><div class="stat-num">${s.totalComments}</div><div class="stat-label">Comments</div></div>
      <div class="stat-card"><div class="stat-num">${formatNum(s.totalViews)}</div><div class="stat-label">Total Views</div></div>
      <div class="stat-card"><div class="stat-num">${s.pendingComments}</div><div class="stat-label">Pending Comments</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:8px">
      <div>
        <h3 style="font-family:var(--heading);font-size:18px;margin-bottom:12px">Recent Articles</h3>
        <table class="data-table">
          <thead><tr><th>Title</th><th>Category</th><th>Views</th></tr></thead>
          <tbody>
            ${(s.recentArticles || []).map(a => `<tr><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.title}</td><td>${a.category_name || '—'}</td><td>${formatNum(a.views)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div>
        <h3 style="font-family:var(--heading);font-size:18px;margin-bottom:12px">🏆 Top Articles</h3>
        <table class="data-table">
          <thead><tr><th>Title</th><th>Views</th></tr></thead>
          <tbody>
            ${(s.topArticles || []).map(a => `<tr><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;color:var(--accent)" onclick="navigate('article','${a.slug}')">${a.title}</td><td>${formatNum(a.views)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div style="margin-top:20px">
      <button class="btn btn-primary" onclick="openNewArticleModal()">✏️ Write New Article</button>
    </div>`;
}

async function renderAdminArticles(el) {
  const r = await apiFetch('/admin/articles?limit=30');
  const data = await r.json();
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="font-family:var(--heading);font-size:24px">Articles (${data.total})</h2>
      <button class="btn btn-primary" onclick="openNewArticleModal()">✏️ New Article</button>
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Views</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${(data.articles || []).map(a => `
            <tr>
              <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600">${a.title}</td>
              <td>${a.category_name || '—'}</td>
              <td><span class="badge ${a.status === 'published' ? 'badge-cat' : 'badge-ghost'}" style="${a.status === 'published' ? 'background:var(--success)' : ''}">${a.status}</span></td>
              <td>${formatNum(a.views)}</td>
              <td>${new Date(a.published_at).toLocaleDateString()}</td>
              <td><div class="actions">
                <button class="btn btn-ghost btn-sm" onclick="navigate('article','${a.slug}')">👁 View</button>
                <button class="btn btn-ghost btn-sm" onclick="openEditArticleModal('${a.slug}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteArticle('${a.slug}')">🗑</button>
              </div></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function renderAdminCategories(el) {
  const r = await fetch(`${API}/categories`);
  const cats = await r.json();
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="font-family:var(--heading);font-size:24px">Categories</h2>
      <button class="btn btn-primary" onclick="showAddCategoryForm()">+ Add Category</button>
    </div>
    <div id="addCatForm" style="display:none;background:var(--paper);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px">
      <div class="form-row">
        <div class="form-group"><label>Name</label><input type="text" id="newCatName" placeholder="Category name"></div>
        <div class="form-group"><label>Icon (emoji)</label><input type="text" id="newCatIcon" placeholder="📰" maxlength="4"></div>
      </div>
      <div class="form-group"><label>Color</label><input type="color" id="newCatColor" value="#D92B2B" style="width:80px;height:36px;border-radius:var(--radius);cursor:pointer"></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="addCategory()">Add Category</button>
        <button class="btn btn-ghost" onclick="document.getElementById('addCatForm').style.display='none'">Cancel</button>
      </div>
    </div>
    <table class="data-table">
      <thead><tr><th>Icon</th><th>Name</th><th>Slug</th><th>Articles</th><th>Actions</th></tr></thead>
      <tbody>
        ${cats.map(c => `
          <tr>
            <td style="font-size:20px">${c.icon}</td>
            <td><strong>${c.name}</strong></td>
            <td><code style="font-family:var(--mono);font-size:12px">${c.slug}</code></td>
            <td>${c.article_count || 0}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}','${c.name}')">🗑 Delete</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function showAddCategoryForm() {
  document.getElementById('addCatForm').style.display = 'block';
}

async function addCategory() {
  const name = document.getElementById('newCatName').value.trim();
  const icon = document.getElementById('newCatIcon').value.trim();
  const color = document.getElementById('newCatColor').value;
  if (!name) return showToast('Name required', 'error');
  const r = await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name, icon, color }) });
  if (r.ok) { showToast('Category added!', 'success'); await loadCategories(); renderAdminPage('categories'); }
  else showToast('Failed', 'error');
}

async function deleteCategory(id, name) {
  if (!confirm(`Delete category "${name}"? Articles will lose their category.`)) return;
  const r = await apiFetch(`/categories/${id}`, { method: 'DELETE' });
  if (r.ok) { showToast('Deleted', 'success'); await loadCategories(); renderAdminPage('categories'); }
}

async function renderAdminComments(el) {
  const r = await apiFetch('/admin/comments');
  const comments = await r.json();
  el.innerHTML = `
    <h2 style="font-family:var(--heading);font-size:24px;margin-bottom:20px">Comments (${comments.length})</h2>
    <table class="data-table">
      <thead><tr><th>Author</th><th>Comment</th><th>Article</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
        ${comments.map(c => `
          <tr>
            <td>${c.user_name || c.guest_name || 'Anonymous'}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.content)}</td>
            <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.article_title || '—'}</td>
            <td>${new Date(c.created_at).toLocaleDateString()}</td>
            <td><div class="actions">
              ${!c.is_approved ? `<button class="btn btn-success btn-sm" onclick="approveComment('${c.id}')">✅ Approve</button>` : ''}
              <button class="btn btn-danger btn-sm" onclick="deleteComment('${c.id}')">🗑</button>
            </div></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function approveComment(id) {
  await apiFetch(`/comments/${id}/approve`, { method: 'PUT' });
  showToast('Approved', 'success');
  renderAdminPage('comments');
}

async function deleteComment(id) {
  if (!confirm('Delete this comment?')) return;
  await apiFetch(`/comments/${id}`, { method: 'DELETE' });
  showToast('Deleted', 'success');
  renderAdminPage('comments');
}

async function renderAdminUsers(el) {
  const r = await apiFetch('/admin/users');
  const users = await r.json();
  el.innerHTML = `
    <h2 style="font-family:var(--heading);font-size:24px;margin-bottom:20px">Users (${users.length})</h2>
    <table class="data-table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-red' : 'badge-ghost'}">${u.role}</span></td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
            <td><span class="badge" style="background:${u.is_active ? 'var(--success)' : 'var(--border)'};color:${u.is_active ? '#fff' : 'var(--ink-light)'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
            <td><button class="btn btn-ghost btn-sm" onclick="toggleUser('${u.id}')">${u.is_active ? '🔒 Disable' : '✅ Enable'}</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function toggleUser(id) {
  await apiFetch(`/admin/users/${id}/toggle`, { method: 'PUT' });
  showToast('User updated', 'success');
  renderAdminPage('users');
}

async function renderAdminSettings(el) {
  const r = await apiFetch('/admin/settings');
  const s = await r.json();
  el.innerHTML = `
    <h2 style="font-family:var(--heading);font-size:24px;margin-bottom:20px">Site Settings</h2>
    <form onsubmit="saveSettings(event)" style="max-width:540px">
      <div class="form-group"><label>Site Name</label><input type="text" name="site_name" value="${s.site_name || ''}"></div>
      <div class="form-group"><label>Tagline</label><input type="text" name="site_tagline" value="${s.site_tagline || ''}"></div>
      <div class="form-group"><label>Articles Per Page</label><input type="number" name="articles_per_page" value="${s.articles_per_page || 12}" min="4" max="50"></div>
      <div class="form-group">
        <label>Allow Comments</label>
        <select name="allow_comments"><option value="true" ${s.allow_comments === 'true' ? 'selected' : ''}>Yes</option><option value="false" ${s.allow_comments !== 'true' ? 'selected' : ''}>No</option></select>
      </div>
      <div class="form-group">
        <label>Require Comment Approval</label>
        <select name="require_comment_approval"><option value="false" ${s.require_comment_approval !== 'true' ? 'selected' : ''}>No (auto approve)</option><option value="true" ${s.require_comment_approval === 'true' ? 'selected' : ''}>Yes</option></select>
      </div>
      <div class="form-group"><label>Twitter URL</label><input type="url" name="social_twitter" value="${s.social_twitter || ''}"></div>
      <div class="form-group"><label>Facebook URL</label><input type="url" name="social_facebook" value="${s.social_facebook || ''}"></div>
      <div class="form-group"><label>Instagram URL</label><input type="url" name="social_instagram" value="${s.social_instagram || ''}"></div>
      <button type="submit" class="btn btn-primary">Save Settings</button>
    </form>`;
}

async function saveSettings(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {};
  fd.forEach((v, k) => body[k] = v);
  const r = await apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(body) });
  if (r.ok) { showToast('Settings saved!', 'success'); await loadSettings(); }
  else showToast('Failed', 'error');
}

// ── Article Modal ─────────────────────────────────────────────────────────
function openNewArticleModal() {
  document.getElementById('articleModalTitle').textContent = 'Write New Article';
  document.getElementById('editArticleId').value = '';
  document.getElementById('articleTitle').value = '';
  document.getElementById('articleExcerpt').value = '';
  document.getElementById('articleContent').value = '';
  document.getElementById('articleImage').value = '';
  document.getElementById('articleTags').value = '';
  document.getElementById('articleFeatured').checked = false;
  document.getElementById('articleBreaking').checked = false;
  document.getElementById('articleStatus').value = 'published';
  populateArticleCategorySelect();
  showModal('articleModal');
}

async function openEditArticleModal(id) {
  const r = await apiFetch(`/admin/articles?limit=100`);
  const data = await r.json();
  const article = (data.articles || []).find(a => a.slug === id);
  if (!article) return showToast('Could not load article', 'error');
  document.getElementById('articleModalTitle').textContent = 'Edit Article';
  document.getElementById('editArticleId').value = id;
  document.getElementById('articleTitle').value = article.title;
  document.getElementById('articleStatus').value = article.status;
  document.getElementById('articleFeatured').checked = !!article.is_featured;
  document.getElementById('articleBreaking').checked = !!article.is_breaking;
  populateArticleCategorySelect(article.category_id);
  showModal('articleModal');
}

function populateArticleCategorySelect(selectedId = '') {
  const sel = document.getElementById('articleCategory');
  sel.innerHTML = `<option value="">No Category</option>` + state.categories.map(c =>
    `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.icon} ${c.name}</option>`
  ).join('');
}

async function handleSaveArticle(e) {
  e.preventDefault();

  const body = {
    title: document.getElementById('articleTitle').value,
    subheading: document.getElementById('articleSubheading').value, // ✅ NEW
    content: document.getElementById('articleContent').value,
    cover_image: document.getElementById('articleImage').value,
    video: document.getElementById('articleVideo').value, // ✅ NEW

    // keep old if you want
    excerpt: document.getElementById('articleExcerpt')?.value || '',
    category_id: document.getElementById('articleCategory')?.value || null,
    tags: document.getElementById('articleTags')?.value
      ?.split(',')
      .map(t => t.trim())
      .filter(Boolean) || [],

    is_featured: document.getElementById('articleFeatured')?.checked || false,
    is_breaking: document.getElementById('articleBreaking')?.checked || false,
    status: document.getElementById('articleStatus')?.value || 'published',
  };

  try {
    const r = await apiFetch('/news', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (r.ok) {
      showToast('Article published!', 'success');
      renderAdminPage('articles');
    } else {
      showToast(data.error || 'Failed', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}
// ── Auth ──────────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value })
  });
  const data = await r.json();
  if (!r.ok) return showToast(data.error || 'Login failed', 'error');
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('pn_token', data.token);
  updateAuthUI();
  hideModal('loginModal');
  showToast(`Welcome back, ${data.user.name}!`, 'success');
  await loadBreakingTicker();
}

async function handleRegister(e) {
  e.preventDefault();
  const r = await fetch(`${API}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: document.getElementById('regName').value, email: document.getElementById('regEmail').value, password: document.getElementById('regPassword').value })
  });
  const data = await r.json();
  if (!r.ok) return showToast(data.error || 'Registration failed', 'error');
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('pn_token', data.token);
  updateAuthUI();
  hideModal('registerModal');
  showToast(`Welcome, ${data.user.name}!`, 'success');
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('pn_token');
  updateAuthUI();
  navigate('home');
  showToast('Signed out', 'success');
}

// ── Modal Helpers ─────────────────────────────────────────────────────────
function showModal(id) {
  document.getElementById(id).style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function hideModal(id) {
  document.getElementById(id).style.display = 'none';
  document.body.style.overflow = '';
}
function switchModal(from, to) { hideModal(from); showModal(to); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
    document.body.style.overflow = '';
  }
});

function toggleUserDropdown() {
  const d = document.getElementById('userDropdown');
  d.style.display = d.style.display === 'none' ? 'block' : 'none';
}

// ── Pagination ────────────────────────────────────────────────────────────
function renderPagination(p, page, param) {
  if (!p || p.pages <= 1) return '';
  const pages = [];
  for (let i = 1; i <= p.pages; i++) pages.push(i);
  return `
    <div class="pagination">
      ${pages.map(i => `
        <button class="page-btn ${i === p.page ? 'active' : ''}" onclick="${page === 'category' ? `renderCategoryPage('${param}',${i})` : `loadMorePage(${i})`}">${i}</button>
      `).join('')}
    </div>`;
}

async function loadMorePage(page) {
  const r = await fetch(`${API}/news?limit=9&page=${page}`);
  const data = await r.json();
  // refresh home with new page
}

// ── Newsletter ────────────────────────────────────────────────────────────
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail').value;
  if (!email || !email.includes('@')) return showToast('Enter a valid email', 'error');
  showToast('Thanks for subscribing!', 'success');
  document.getElementById('newsletterEmail').value = '';
}

// ── Search Page ───────────────────────────────────────────────────────────
async function renderSearchPage(query) {
  if (!query) { navigate('home'); return; }
  const r = await fetch(`${API}/news?search=${encodeURIComponent(query)}&limit=20`);
  const data = await r.json();
  const articles = data.articles || [];
  document.getElementById('mainContent').innerHTML = `
    <div class="section-header">
      <div class="section-title">🔍 Results for "${query}"</div>
      <div class="section-link">${articles.length} article${articles.length !== 1 ? 's' : ''} found</div>
    </div>
    ${articles.length
      ? `<div class="card-grid">${articles.map(a => renderCard(a)).join('')}</div>`
      : `<div class="empty-state"><div class="empty-icon">🔍</div><h3>No results found</h3><p>Try different keywords or browse categories above.</p></div>`}
  `;
}

// ── Utilities ─────────────────────────────────────────────────────────────
function timeAgo(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderError(msg) {
  return `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Something went wrong</h3><p>${msg}</p><button class="btn btn-primary" onclick="navigate('home')" style="margin-top:16px">Go Home</button></div>`;
}

function getEmbedUrl(url) {
  if (!url) return '';

  try {
    const u = new URL(url);

    // ✅ youtube.com/watch?v=...
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }

    // ✅ youtu.be/...
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }

  } catch (e) {
    console.log("Invalid URL");
  }

  return '';
}
function getVideoId(url) {
  try {
    const u = new URL(url);

    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }

    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1);
    }

  } catch (e) {}

  return '';
}
// ── Start ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);


function playVideo(el, url) {
  if (!url) {
    el.innerHTML = "<p>No video found</p>";
    return;
  }

  let videoId = '';

  try {
    const u = new URL(url);

    if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v');
    }

    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1);
    }

  } catch (e) {}

  if (!videoId) {
    el.innerHTML = `
      <div style="padding:20px;text-align:center">
        <p>⚠️ Cannot play video</p>
        <a href="${url}" target="_blank">▶ Open in YouTube</a>
      </div>
    `;
    return;
  }

  const embed = `https://www.youtube.com/embed/${videoId}`;

  el.innerHTML = `
    <iframe width="100%" height="400"
      src="${embed}?autoplay=1"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen>
    </iframe>
  `;
}
