const express = require('express');
const Groq = require('groq-sdk');
const { authenticate } = require('./auth');
const File = require('../models/File');
const ChatMessage = require('../models/ChatMessage');
const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function buildDataContext(userId) {
  const files = await File.find({ userId });
  if (!files.length) return 'No data has been uploaded yet.';

  return files.map(file => {
    const sampleRows = (file.rows || []).slice(0, 10);
    const summaryText = Object.entries(file.summary || {})
      .filter(([, v]) => v && typeof v === 'object' && 'avg' in v)
      .map(([col, s]) => `${col}: avg=${s.avg}, min=${s.min}, max=${s.max}, count=${s.count}`)
      .join('; ');

    return `File: "${file.originalName}" (${file.totalRows || 0} rows, columns: ${(file.columns || []).join(', ')})
Stats: ${summaryText || 'N/A'}
Sample data (first few rows): ${JSON.stringify(sampleRows)}`;
  }).join('\n\n');
}

router.post('/message', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const userId = req.user.id;

    // Save incoming user message to DB
    const userMsg = new ChatMessage({ userId, role: 'user', content: message });
    await userMsg.save();

    // Fetch 15 most recent history records for context, then reverse back to chronological order
    const rawHistory = await ChatMessage.find({ userId }).sort({ timestamp: -1 }).limit(15);
    const history = rawHistory.reverse();
    
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const dataContext = await buildDataContext(userId);
    const systemPrompt = `You are a smart BI (Business Intelligence) data analyst assistant running on Groq. You have access to the user's uploaded data and can answer questions, generate insights, spot trends, and explain patterns.

USER DATA CONTEXT:
${dataContext}

Guidelines:
- Be concise, professional, and extremely analytical
- Use numbers and specifics from the data provided in the context
- If asked for charts or visualizations, describe what a good chart setup would look like
- If no data is present, advise the user to upload a CSV or spreadsheet
- Format numbers gracefully (commas for thousands, 2 decimal places)`;

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_')) {
       throw new Error('GROQ API Key missing or unconfigured in .env');
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || "I'm unable to generate a response right now.";
    
    // Save assistant reply to DB
    const assistantMsg = new ChatMessage({ userId, role: 'assistant', content: reply });
    await assistantMsg.save();

    res.json({ reply });

  } catch (err) {
    console.error("Groq/Chat Error:", err.message);
    
    // Fallback response strategy if API key fails or errors out
    const fileCount = await File.countDocuments({ userId: req.user.id });
    let reply = '';
    const msgLower = req.body.message?.toLowerCase() || '';

    if (fileCount === 0) {
      reply = "Please upload some data files first, then I can provide analytical breakdown! 📂";
    } else if (msgLower.includes('how many') || msgLower.includes('count')) {
       const userFiles = await File.find({ userId: req.user.id });
       const totalRows = userFiles.reduce((a, f) => a + (f.totalRows || 0), 0);
       reply = `You have ${fileCount} file(s) indexed with approximately ${totalRows} total rows analyzed.`;
    } else {
       reply = `Notice: There was an issue reaching the Groq AI service. Please ensure valid GROQ_API_KEY is present in .env.\n\nStatus: Connected to MongoDB database, found ${fileCount} file(s).`;
    }

    res.json({ reply });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await ChatMessage.find({ userId: req.user.id }).sort({ timestamp: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/history', authenticate, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
