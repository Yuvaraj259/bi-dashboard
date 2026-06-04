# DataLens — BI Dashboard

A full-stack Business Intelligence dashboard with AI-powered chat analysis.

## Features
- 🔐 User auth (register / login / JWT sessions)
- 📂 Upload any file type — CSV, Excel, JSON, TXT, PDF, images, and more
- 📊 Auto-generated BI charts (bar, line, doughnut) from your data
- 🤖 AI chatbot powered by Claude (Anthropic) to answer questions about your data
- 👤 User profile page

---

## Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
Edit `backend/.env`:
```
PORT=3000
SESSION_SECRET=your-secret-here
JWT_SECRET=your-jwt-secret-here
ANTHROPIC_API_KEY=your_anthropic_api_key_here   ← Add this for full AI chat
```

Get a free Anthropic API key at: https://console.anthropic.com

### 3. Run the server
```bash
cd backend
node server.js
```

### 4. Open in browser
Visit: **http://localhost:3000**

---

## Project Structure
```
bi-dashboard/
├── backend/
│   ├── server.js          # Express server entry
│   ├── package.json
│   ├── .env               # Environment variables
│   ├── uploads/           # Uploaded files (auto-created)
│   └── routes/
│       ├── auth.js        # Register / Login / Profile
│       ├── upload.js      # File upload & parsing
│       ├── dashboard.js   # Analytics & chart data
│       └── chat.js        # AI chatbot (Claude API)
└── frontend/
    ├── index.html
    ├── css/
    │   └── main.css
    └── js/
        ├── api.js          # API client
        ├── auth.js         # Auth pages
        ├── upload.js       # Upload page
        ├── dashboard.js    # Dashboard & charts
        ├── chat.js         # Chat page
        └── app.js          # Router & app shell
```

## Supported File Types
| Type | Parsing | Charts |
|------|---------|--------|
| .csv | ✅ Full | ✅ Auto |
| .xlsx / .xls | ✅ Full | ✅ Auto |
| .json | ✅ Full | ✅ Auto |
| .txt | ✅ Lines | ✅ Basic |
| .pdf / images | 📁 Stored | ❌ |

## Tech Stack
- **Backend**: Node.js, Express, Multer, JWT, bcryptjs
- **Frontend**: Vanilla JS, Chart.js, Google Fonts
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)

## Notes
- Data is stored **in-memory** — restart clears users/files. For production, add MongoDB/PostgreSQL.
- The chatbot works without an API key using rule-based fallback responses.
- Upload limit: 50MB per file.
