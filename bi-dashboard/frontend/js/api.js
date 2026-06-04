const API_BASE = 'http://localhost:3000/api';

const Api = {
  token: localStorage.getItem('bi_token'),

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('bi_token', token);
    else localStorage.removeItem('bi_token');
  },

  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  },

  async request(method, path, body) {
    const opts = { method, headers: this.headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (res.status === 401 && data.error === 'Invalid token') {
      localStorage.removeItem('bi_token');
      localStorage.removeItem('bi_user');
      window.location.reload();
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get: (path) => Api.request('GET', path),
  post: (path, body) => Api.request('POST', path, body),
  delete: (path) => Api.request('DELETE', path),

  async uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_BASE + '/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${Api.token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 400) reject(new Error(data.error || 'Upload failed'));
          else resolve(data);
        } catch { reject(new Error('Parse error')); }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  }
};
