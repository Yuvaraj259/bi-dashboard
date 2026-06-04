const Auth = {
  currentUser: null,

  init() {
    const stored = localStorage.getItem('bi_user');
    if (stored) {
      try { this.currentUser = JSON.parse(stored); } catch {}
    }
  },

  save(token, user) {
    Api.setToken(token);
    this.currentUser = user;
    localStorage.setItem('bi_user', JSON.stringify(user));
  },

  clear() {
    Api.setToken(null);
    this.currentUser = null;
    localStorage.removeItem('bi_user');
  },

  isLoggedIn() {
    return !!this.currentUser && !!Api.token;
  },

  renderLogin() {
    return `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-brand">DataLens</div>
        <div class="auth-tagline">Upload your data. Visualize insights. Chat with your numbers.</div>
        <div class="auth-features">
          <div class="auth-feature"><div class="auth-feature-dot"></div>Upload any file type — CSV, Excel, JSON, and more</div>
          <div class="auth-feature"><div class="auth-feature-dot" style="background:var(--accent2)"></div>Auto-generated BI charts and analytics</div>
          <div class="auth-feature"><div class="auth-feature-dot" style="background:var(--accent3)"></div>AI chatbot that answers questions about your data</div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-box">
          <div class="auth-form-title">Welcome back</div>
          <div class="auth-form-sub">Sign in to your DataLens account</div>
          <div class="auth-form" id="login-form">
            <div class="input-group">
              <label class="input-label">Email</label>
              <input class="input" type="email" id="login-email" placeholder="you@example.com" autocomplete="email"/>
            </div>
            <div class="input-group">
              <label class="input-label">Password</label>
              <input class="input" type="password" id="login-password" placeholder="••••••••" autocomplete="current-password"/>
            </div>
            <button class="btn btn-primary" id="login-btn" style="width:100%;justify-content:center">
              Sign In
            </button>
          </div>
          <div class="auth-switch">Don't have an account? <a id="go-register">Create one</a></div>
        </div>
      </div>
    </div>`;
  },

  renderRegister() {
    return `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-brand">DataLens</div>
        <div class="auth-tagline">Your intelligent business intelligence companion.</div>
        <div class="auth-features">
          <div class="auth-feature"><div class="auth-feature-dot"></div>Secure file storage and analysis</div>
          <div class="auth-feature"><div class="auth-feature-dot" style="background:var(--accent2)"></div>Real-time chart generation from your data</div>
          <div class="auth-feature"><div class="auth-feature-dot" style="background:var(--accent3)"></div>AI-powered Q&A on your datasets</div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-box">
          <div class="auth-form-title">Create account</div>
          <div class="auth-form-sub">Start analyzing your data today</div>
          <div class="auth-form" id="register-form">
            <div class="input-group">
              <label class="input-label">Full Name</label>
              <input class="input" type="text" id="reg-name" placeholder="Jane Doe"/>
            </div>
            <div class="input-group">
              <label class="input-label">Email</label>
              <input class="input" type="email" id="reg-email" placeholder="you@example.com"/>
            </div>
            <div class="input-group">
              <label class="input-label">Password</label>
              <input class="input" type="password" id="reg-password" placeholder="Min. 6 characters"/>
            </div>
            <button class="btn btn-primary" id="register-btn" style="width:100%;justify-content:center">
              Create Account
            </button>
          </div>
          <div class="auth-switch">Already have an account? <a id="go-login">Sign in</a></div>
        </div>
      </div>
    </div>`;
  },

  bindLogin() {
    document.getElementById('login-btn').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      if (!email || !password) return Toast.show('Please fill in all fields', 'error');
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Signing in...';
      try {
        const { token, user } = await Api.post('/auth/login', { email, password });
        Auth.save(token, user);
        App.showApp();
      } catch (err) {
        Toast.show(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
      }
    });
    document.getElementById('go-register').addEventListener('click', () => App.showRegister());
    // Enter key
    document.getElementById('login-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('login-btn').click();
    });
  },

  bindRegister() {
    document.getElementById('register-btn').addEventListener('click', async () => {
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      if (!name || !email || !password) return Toast.show('Please fill in all fields', 'error');
      if (password.length < 6) return Toast.show('Password must be at least 6 characters', 'error');
      const btn = document.getElementById('register-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Creating...';
      try {
        const { token, user } = await Api.post('/auth/register', { name, email, password });
        Auth.save(token, user);
        Toast.show('Account created! Welcome to DataLens 🎉', 'success');
        App.showApp();
      } catch (err) {
        Toast.show(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
      }
    });
    document.getElementById('go-login').addEventListener('click', () => App.showLogin());
  }
};
