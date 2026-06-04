const express = require('express');
const { authenticate } = require('./auth');
const File = require('../models/File');
const router = express.Router();

router.get('/analytics', authenticate, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id });
    if (!files.length) return res.json({ charts: [], stats: [], totalFiles: 0, totalRows: 0 });

    const charts = [];
    const stats = [];

    files.forEach(file => {
      if (!file.rows || file.rows.length === 0) return;

      const numericCols = file.columns.filter(col => {
        const nums = file.rows.map(r => parseFloat(r[col])).filter(n => !isNaN(n));
        return nums.length > file.rows.length * 0.5;
      });

      const categoryCols = file.columns.filter(col => !numericCols.includes(col));

      // Bar/Line chart: category vs numeric
      if (categoryCols.length > 0 && numericCols.length > 0) {
        const labelCol = categoryCols[0];
        const valueCol = numericCols[0];

        const grouped = {};
        file.rows.forEach(row => {
          const label = String(row[labelCol] || 'Unknown').slice(0, 20);
          const val = parseFloat(row[valueCol]) || 0;
          grouped[label] = (grouped[label] || 0) + val;
        });

        const topEntries = Object.entries(grouped).slice(0, 15);
        charts.push({
          id: `bar_${file._id}`,
          type: 'bar',
          title: `${valueCol} by ${labelCol}`,
          source: file.originalName,
          labels: topEntries.map(([k]) => k),
          data: topEntries.map(([, v]) => parseFloat(v.toFixed(2)))
        });
      }

      // Line chart over numeric cols
      if (numericCols.length >= 2) {
        const sample = file.rows.slice(0, 20);
        charts.push({
          id: `line_${file._id}`,
          type: 'line',
          title: `${numericCols[0]} vs ${numericCols[1]} trend`,
          source: file.originalName,
          labels: sample.map((_, i) => `Row ${i + 1}`),
          data: sample.map(r => parseFloat(r[numericCols[0]]) || 0),
          data2: sample.map(r => parseFloat(r[numericCols[1]]) || 0),
          label2: numericCols[1]
        });
      }

      // Pie chart for category distribution
      if (categoryCols.length > 0) {
        const col = categoryCols[0];
        const freq = {};
        file.rows.forEach(r => {
          const k = String(r[col] || 'N/A').slice(0, 20);
          freq[k] = (freq[k] || 0) + 1;
        });
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
        charts.push({
          id: `pie_${file._id}`,
          type: 'pie',
          title: `Distribution of ${col}`,
          source: file.originalName,
          labels: top.map(([k]) => k),
          data: top.map(([, v]) => v)
        });
      }

      // Summary stats cards
      Object.entries(file.summary || {}).forEach(([col, s]) => {
        if (s && typeof s === 'object' && 'avg' in s) {
          stats.push({ label: col, avg: s.avg, min: s.min, max: s.max, count: s.count, source: file.originalName });
        }
      });
    });

    res.json({
      charts,
      stats,
      totalFiles: files.length,
      totalRows: files.reduce((a, f) => a + (f.totalRows || 0), 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
