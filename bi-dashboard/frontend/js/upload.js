const Upload = {
  files: [],

  fileIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = { csv: '📊', xlsx: '📗', xls: '📗', json: '📋', txt: '📄', pdf: '📕', png: '🖼️', jpg: '🖼️', jpeg: '🖼️' };
    return map[ext] || '📁';
  },

  fileBg(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = { csv: 'rgba(67,233,123,0.1)', xlsx: 'rgba(67,233,123,0.1)', json: 'rgba(108,99,255,0.1)', pdf: 'rgba(255,101,132,0.1)' };
    return map[ext] || 'rgba(108,99,255,0.08)';
  },

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  render() {
    return `
    <div class="page-header">
      <div class="page-title">Upload Data</div>
      <div class="page-subtitle">Import any file — CSV, Excel, JSON, TXT, PDF, images, and more</div>
    </div>

    <div class="drop-zone" id="drop-zone">
      <input type="file" id="file-input" multiple accept="*/*"/>
      <div class="drop-icon">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
        </svg>
      </div>
      <div class="drop-title">Drop files here or click to browse</div>
      <div class="drop-sub">All file types accepted · Max 50MB per file</div>
      <div class="file-types">
        <span class="file-type-badge">.csv</span>
        <span class="file-type-badge">.xlsx</span>
        <span class="file-type-badge">.json</span>
        <span class="file-type-badge">.txt</span>
        <span class="file-type-badge">.pdf</span>
        <span class="file-type-badge">+ more</span>
      </div>
    </div>

    <div class="upload-progress" id="upload-progress">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px;color:var(--text-muted)">
        <span id="upload-filename">Uploading...</span>
        <span id="upload-pct">0%</span>
      </div>
      <div class="progress-bar-wrap"><div class="progress-bar" id="progress-bar"></div></div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:32px;margin-bottom:16px;">
      <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;">Uploaded Files</div>
      <button class="btn btn-ghost btn-sm" id="refresh-files-btn">↻ Refresh</button>
    </div>
    <div class="files-list" id="files-list">
      <div class="full-loader"><div class="spinner"></div> Loading files...</div>
    </div>`;
  },

  renderFileItem(f) {
    return `
    <div class="file-item" data-id="${f._id}">
      <div class="file-icon" style="background:${this.fileBg(f.originalName)}">${this.fileIcon(f.originalName)}</div>
      <div class="file-info">
        <div class="file-name">${f.originalName}</div>
        <div class="file-meta">${this.formatSize(f.size)} · ${f.totalRows ? f.totalRows.toLocaleString() + ' rows · ' : ''}${(f.columns || []).length} columns · ${new Date(f.uploadedAt).toLocaleDateString()}</div>
      </div>
      <div class="file-actions">
        <button class="btn btn-ghost btn-sm delete-file-btn" data-id="${f._id}">🗑 Delete</button>
      </div>
    </div>`;
  },

  async loadFiles() {
    try {
      const files = await Api.get('/upload/files');
      this.files = files;
      const list = document.getElementById('files-list');
      if (!list) return;
      if (!files.length) {
        list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:14px;">No files uploaded yet. Upload your first dataset above!</div>`;
      } else {
        list.innerHTML = files.map(f => this.renderFileItem(f)).join('');
        list.querySelectorAll('.delete-file-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            btn.disabled = true;
            btn.textContent = '...';
            try {
              await Api.delete(`/upload/files/${id}`);
              Toast.show('File deleted', 'success');
              await this.loadFiles();
            } catch (err) {
              Toast.show(err.message, 'error');
              btn.disabled = false;
              btn.textContent = '🗑 Delete';
            }
          });
        });
      }
    } catch (err) {
      const list = document.getElementById('files-list');
      if (list) list.innerHTML = `<div style="color:var(--error);padding:20px;font-size:13px;">Failed to load files: ${err.message}</div>`;
    }
  },

  bind() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files);
      if (files.length) this.handleFiles(files);
    });
    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files);
      if (files.length) this.handleFiles(files);
    });

    document.getElementById('refresh-files-btn').addEventListener('click', () => this.loadFiles());
    this.loadFiles();
  },

  async handleFiles(files) {
    for (const file of files) {
      await this.uploadFile(file);
    }
    await this.loadFiles();
  },

  async uploadFile(file) {
    const progressEl = document.getElementById('upload-progress');
    const bar = document.getElementById('progress-bar');
    const pct = document.getElementById('upload-pct');
    const nameEl = document.getElementById('upload-filename');

    progressEl.style.display = 'block';
    nameEl.textContent = `Uploading ${file.name}...`;
    bar.style.width = '0%';
    pct.textContent = '0%';

    try {
      await Api.uploadFile(file, (p) => {
        bar.style.width = p + '%';
        pct.textContent = p + '%';
      });
      bar.style.width = '100%';
      pct.textContent = '100%';
      Toast.show(`✓ ${file.name} uploaded successfully`, 'success');
    } catch (err) {
      Toast.show(`Failed to upload ${file.name}: ${err.message}`, 'error');
    } finally {
      setTimeout(() => { progressEl.style.display = 'none'; }, 1200);
    }
  }
};
