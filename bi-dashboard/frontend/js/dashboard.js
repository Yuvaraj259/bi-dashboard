const Dashboard = {
  chartInstances: {},

  COLORS: [
    '#63d8ffff', '#ff6584', '#43e97b', '#a28236ff', '#06d6a0', '#118ab2', '#ef476f', '#ffd166',
    '#8338ec', '#fb5607', '#3a86ff', '#06d6a0'
  ],

  render() {
    return `
    <div class="page-header">
      <div class="page-title">BI Dashboard</div>
      <div class="page-subtitle">Auto-generated visualizations from your uploaded data</div>
    </div>
    <div class="stats-grid" id="stats-grid">
      <div class="full-loader"><div class="spinner"></div></div>
    </div>
    <div id="charts-section"></div>`;
  },

  async load() {
    try {
      const { charts, stats, totalFiles, totalRows } = await Api.get('/dashboard/analytics');

      // Destroy old chart instances
      Object.values(this.chartInstances).forEach(c => { try { c.destroy(); } catch { } });
      this.chartInstances = {};
      this.renderStats(stats, totalFiles, totalRows);

      if (!charts.length) {
        document.getElementById('charts-section').innerHTML = `
        <div class="no-data">
          <div class="no-data-icon">📂</div>
          <h3>No charts yet</h3>
          <p>Upload CSV, Excel, or JSON files to auto-generate charts</p>
          <button class="btn btn-primary" style="margin-top:20px" onclick="App.navigate('upload')">Upload Data</button>
        </div>`;
        return;
      }

      document.getElementById('charts-section').innerHTML = `
        <div class="charts-grid" id="charts-grid">
          ${charts.map(c => `
          <div class="chart-card">
            <div class="chart-title">${c.title}</div>
            <div class="chart-source">Source: ${c.source}</div>
            <div class="chart-wrap"><canvas id="chart-${c.id}"></canvas></div>
          </div>`).join('')}
        </div>`;

      charts.forEach(c => this.drawChart(c));

    } catch (err) {
      document.getElementById('stats-grid').innerHTML = `<div style="color:var(--error);font-size:13px;">Failed to load: ${err.message}</div>`;
    }
  },

  renderStats(stats, totalFiles, totalRows) {
    const grid = document.getElementById('stats-grid');
    const topStats = stats.slice(0, 4);
    const cards = [
      `<div class="stat-card"><div class="stat-label">Total Files</div><div class="stat-value">${totalFiles || 0}</div><div class="stat-sub">datasets uploaded</div></div>`,
      `<div class="stat-card"><div class="stat-label">Total Rows</div><div class="stat-value">${(totalRows || 0).toLocaleString()}</div><div class="stat-sub">data points</div></div>`,
      ...topStats.map(s => `
        <div class="stat-card">
          <div class="stat-label">${s.label}</div>
          <div class="stat-value">${parseFloat(s.avg).toLocaleString()}</div>
          <div class="stat-sub">avg · min ${parseFloat(s.min).toLocaleString()} · max ${parseFloat(s.max).toLocaleString()}</div>
        </div>`)
    ];
    grid.innerHTML = cards.join('');
  },

  drawChart(c) {
    const canvas = document.getElementById('chart-' + c.id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#7a7a9a', font: { family: 'DM Sans', size: 11 }, boxWidth: 12 } },
        tooltip: {
          backgroundColor: '#bb1d6cff',
          borderColor: '#60050aff',
          borderWidth: 1,
          titleColor: '#e8e8f0',
          bodyColor: '#7a7a9a',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: { ticks: { color: '#7a7a9a', font: { size: 10 } }, grid: { color: '#1a1a26' } },
        y: { ticks: { color: '#7a7a9a', font: { size: 10 } }, grid: { color: '#2a2a3d' } }
      }
    };

    if (c.type === 'bar') {
      this.chartInstances[c.id] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: c.labels,
          datasets: [{ label: c.title, data: c.data, backgroundColor: this.COLORS.map(col => col + 'cc'), borderColor: this.COLORS, borderWidth: 1, borderRadius: 6 }]
        },
        options: { ...baseOpts }
      });
    } else if (c.type === 'line') {
      const datasets = [{
        label: c.title.split(' vs ')[0],
        data: c.data,
        borderColor: '#6c63ff',
        backgroundColor: 'rgba(108,99,255,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#6c63ff'
      }];
      if (c.data2) {
        datasets.push({
          label: c.label2 || 'Series 2',
          data: c.data2,
          borderColor: '#ff6584',
          backgroundColor: 'rgba(255,101,132,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#ff6584'
        });
      }
      this.chartInstances[c.id] = new Chart(ctx, { type: 'line', data: { labels: c.labels, datasets }, options: { ...baseOpts } });
    } else if (c.type === 'pie') {
      const noScale = { ...baseOpts };
      delete noScale.scales;
      this.chartInstances[c.id] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: c.labels,
          datasets: [{ data: c.data, backgroundColor: this.COLORS.map(col => col + 'dd'), borderColor: '#12121a', borderWidth: 2, hoverOffset: 6 }]
        },
        options: { ...noScale, cutout: '55%' }
      });
    }
  }
};
