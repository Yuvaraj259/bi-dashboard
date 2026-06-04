const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const { authenticate } = require('./auth');
const File = require('../models/File');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

function extractData(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  let rows = [], columns = [], summary = {};

  try {
    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf8');
      rows = parse(content, { columns: true, skip_empty_lines: true });
      columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    } else if (ext === '.xlsx' || ext === '.xls') {
      const wb = XLSX.readFile(filePath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws);
      columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    } else if (ext === '.json') {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : [parsed];
      columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    } else if (ext === '.txt') {
      const content = fs.readFileSync(filePath, 'utf8');
      rows = content.split('\n').filter(Boolean).map((line, i) => ({ line: i + 1, content: line }));
      columns = ['line', 'content'];
    } else {
      const stat = fs.statSync(filePath);
      return { rows: [], columns: [], summary: { type: ext, size: stat.size, message: 'Binary file preview unavailable.' } };
    }

    columns.forEach(col => {
      const nums = rows.map(r => parseFloat(r[col])).filter(n => !isNaN(n));
      if (nums.length > 0) {
        summary[col] = {
          min: Math.min(...nums),
          max: Math.max(...nums),
          avg: (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2),
          count: nums.length
        };
      }
    });
  } catch (e) {
    summary.parseError = e.message;
  }

  return { rows: rows.slice(0, 500), columns, summary, totalRows: rows.length };
}

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = extractData(req.file.path, req.file.originalname);
    
    const fileRecord = new File({
      userId: req.user.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      ...result
    });

    await fileRecord.save();
    res.json({ success: true, file: fileRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/files', authenticate, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id }).select('-rows'); // Exclude detailed rows for list to save bandwidth
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/files/:fileId', authenticate, async (req, res) => {
  try {
    await File.findOneAndDelete({ _id: req.params.fileId, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
