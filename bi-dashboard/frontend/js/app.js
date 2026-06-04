// ─── TOAST UTILITY ───────────────────────────────────────────────
const Toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(msg, type = 'info') {
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }
};

// ─── APP ─────────────────────────────────────────────────────────
const App = {
  currentPage: 'dashboard',

  init() {
    Toast.init();
    Auth.init();
    if (Auth.isLoggedIn()) {
      this.showApp();
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    document.getElementById('app').innerHTML = Auth.renderLogin();
    Auth.bindLogin();
  },

  showRegister() {
    document.getElementById('app').innerHTML = Auth.renderRegister();
    Auth.bindRegister();
  },

  showApp() {
    const user = Auth.currentUser;
    const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    document.getElementById('app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-logo">DataLens</div>
        <nav class="sidebar-nav">
          ${this.navItem('dashboard', svgChart(), 'Dashboard')}
          ${this.navItem('upload', svgUpload(), 'Upload Data')}
          ${this.navItem('chat', svgChat(), 'AI Assistant')}
          ${this.navItem('profile', svgUser(), 'Profile')}
        </nav>
        <div class="sidebar-bottom">
          <div class="user-chip">
            <div class="user-avatar">${initials}</div>
            <div class="user-info">
              <div class="user-name">${user.name}</div>
              <div class="user-email">${user.email}</div>
            </div>
            <button class="logout-btn" id="logout-btn" title="Logout">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
      <main class="main-content">
        <div id="page-dashboard" class="page"></div>
        <div id="page-upload" class="page"></div>
        <div id="page-chat" class="page"></div>
        <div id="page-profile" class="page"></div>
      </main>
    </div>`;

    document.getElementById('logout-btn').addEventListener('click', () => {
      Auth.clear();
      Toast.show('Logged out', 'info');
      this.showLogin();
    });

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.navigate(item.dataset.page));
    });

    this.navigate('dashboard');
  },

  navItem(page, icon, label) {
    return `<button class="nav-item" data-page="${page}">
      ${icon}
      <span>${label}</span>
    </button>`;
  },

  navigate(page) {
    this.currentPage = page;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const pageEl = document.getElementById('page-' + page);
    pageEl.classList.add('active');

    // Render page content
    if (page === 'dashboard') {
      pageEl.innerHTML = Dashboard.render();
      Dashboard.load();
    } else if (page === 'upload') {
      pageEl.innerHTML = Upload.render();
      Upload.bind();
    } else if (page === 'chat') {
      pageEl.innerHTML = Chat.render();
      Chat.bind();
    } else if (page === 'profile') {
      pageEl.innerHTML = ProfilePage.render();
      ProfilePage.load();
    }
  }
};

// ─── PROFILE PAGE ─────────────────────────────────────────────────
const ProfilePage = {
  render() {
    const user = Auth.currentUser;
    const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
    <div class="page-header">
      <div class="page-title">Profile</div>
      <div class="page-subtitle">Your account information</div>
    </div>
    <div class="profile-grid">
      <div class="card">
        <div class="profile-avatar-lg">${initials}</div>
        <div class="profile-name">${user.name}</div>
        <div class="profile-email">${user.email}</div>
        <div style="margin-top:24px;">
          <div class="info-row"><span class="info-key">User ID</span><span class="info-val" style="font-size:11px;font-family:monospace;color:var(--text-muted)">${user.id}</span></div>
          <div class="info-row"><span class="info-key">Files Uploaded</span><span class="info-val" id="profile-files-count">...</span></div>
          <div class="info-row"><span class="info-key">Plan</span><span class="info-val" style="color:var(--accent3)">Free</span></div>
        </div>
        <button class="btn btn-danger btn-sm" style="margin-top:24px" id="profile-logout-btn">Sign Out</button>
      </div>
      <div class="card">
        <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:20px;">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <button class="btn btn-ghost" onclick="App.navigate('upload')">📂 Upload New Data</button>
          <button class="btn btn-ghost" onclick="App.navigate('dashboard')">📊 View Dashboard</button>
          <button class="btn btn-ghost" onclick="App.navigate('chat')">🤖 Open AI Assistant</button>
        </div>
      </div>
    </div>`;
  },

  async load() {
    try {
      const { filesCount } = await Api.get('/auth/profile');
      const el = document.getElementById('profile-files-count');
      if (el) el.textContent = filesCount;
    } catch {}
    document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
      Auth.clear();
      App.showLogin();
    });
  }
};

// ─── SVG ICONS ────────────────────────────────────────────────────
function svgChart() {
  return `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>`;
}
function svgUpload() {
  return `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>`;
}
function svgChat() {
  return `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>`;
}
function svgUser() {
  return `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>`;
}

// ─── BOOT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
