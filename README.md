# 📈 Stock Whisperer
### AI-Powered Chart Intelligence for Indian Investors
> ET AI Hackathon 2026 · Problem Statement 6: AI for the Indian Investor

<div align="center">

![Stock Whisperer](https://img.shields.io/badge/Stock%20Whisperer-AI%20Powered-blue?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-orange?style=for-the-badge)

</div>

---

## What It Does

Stock Whisperer detects chart patterns on NSE/BSE stocks, back-tests them against 3 years of Indian market data, and synthesizes technical signals, news sentiment, and promoter activity into a single **Confluence Score** — delivered as plain-language analysis in English, Hindi, or Hinglish.

India has 14 crore+ demat accounts but most retail investors rely on tips and gut feel. Stock Whisperer gives them what was previously only available to professional analysts — in a language they actually speak.

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | _Deploy URL here_ |
| Backend API | _Render URL here_ |

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🎯 **Confluence Score** | 0–100 score combining 6 weighted signals into one number |
| 📐 **Pattern Detection** | 8 chart patterns detected using TA-Lib + pandas-ta |
| 📊 **NSE Backtesting** | Every pattern back-tested against 3 years of Nifty 500 data |
| 🗣️ **Hindi / Hinglish** | Full analysis in EN, Hindi, or Hinglish — first tool of its kind |
| 📰 **News Sentiment** | ET Markets + Google News RSS classified by Gemini 2.5 Flash |
| 🏢 **Promoter Activity** | BSE bulk deal scraper integrated into the score |
| 💬 **AI Chat Q&A** | Context-aware follow-up questions in any language |
| ⚡ **< 8 sec** | Full AI analysis from cold start |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend  (React + Vite)                    │
│   HomePage → TickerSearch → StockInfoCard + Chart        │
│              ↓ AnalysisCard + Q&A Chat                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (Axios + React Query)
┌──────────────────────▼──────────────────────────────────┐
│           Backend  (FastAPI · port 8000)                 │
│  /api/search  /api/quote  /api/chart  /api/analysis      │
│  /api/promoter  /api/news  /api/chat                     │
│  Caching: in-memory TTL dict (upgradeable to Redis)      │
└──────────┬─────────────────────────┬────────────────────┘
           │ yfinance / BSE scraper  │ httpx (internal)
           │                         ▼
    ┌──────▼──────┐   ┌──────────────────────────────────┐
    │Yahoo Finance│   │    AI/ML Service  (port 8001)     │
    │  BSE India  │   │  /api/pattern   (TA-Lib)          │
    │  Google RSS │   │  /api/confluence (scoring engine) │
    └─────────────┘   │  /api/sentiment  (Gemini)         │
                      │  /api/narrative  (Gemini)         │
                      │  /api/gemini-chat (Gemini)        │
                      └──────────────────────────────────┘
```

**Deployment:**
```
Frontend  →  Vercel   (auto-deploy on push to main)
Backend   →  Render   (Web Service, port 8000)
ML Service→  Render   (Web Service, port 8001)
```

---

## Confluence Score Formula

```
Signal              Max Points   How Scored
─────────────────────────────────────────────────────
Pattern strength      30 pts     TA-Lib confidence scaled to 30
Volume confirmation   15 pts     Spike >1.5x 20-day average at breakout
RSI positioning       15 pts     RSI <40 bullish setup / >60 bearish
MACD crossover        15 pts     Histogram flipped in pattern direction
News sentiment        15 pts     Positive=15, Neutral=7, Negative=0
Promoter activity     10 pts     Buying=+10, Pledging=-10, base=5
─────────────────────────────────────────────────────
Total                 0–100

71–100 = Strong Setup  🟢
41–70  = Moderate Setup 🟡
0–40   = Weak Setup    🔴
```

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- Python 3.12+
- Gemini API key — https://aistudio.google.com (free tier)

### 1. Clone
```bash
git clone https://github.com/HarshSharma9026/stock-whisperer.git
cd stock-whisperer
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env → add your GEMINI_API_KEY
```

> ⚠️ `.env` is gitignored. Never commit your API key.

### 3. Run Backend (port 8000)
```bash
uvicorn main:app --reload
# Test: http://localhost:8000/api/health
```

### 4. Run ML Service (port 8001)
```bash
# New terminal, from /backend with venv active
uvicorn agents.ml_service:app --port 8001 --reload
# Test: http://localhost:8001/api/ml/health
```

### 5. Frontend setup
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000
```

### 6. Run Frontend (port 5173)
```bash
npm run dev
# Open: http://localhost:5173
```

---

## Environment Variables

### `backend/.env`
```
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost:5173
```

### `frontend/.env.local`
```
VITE_API_URL=http://localhost:8000
```

---

## API Reference

### Backend (port 8000)

| Endpoint | Method | Params | Cache | Description |
|----------|--------|--------|-------|-------------|
| `/api/health` | GET | — | — | Health check |
| `/api/search` | GET | `q` | — | NSE/BSE symbol autocomplete |
| `/api/quote` | GET | `ticker` | 2 min | Live price + fundamentals |
| `/api/chart` | GET | `ticker`, `period` | 15 min | OHLCV candlestick data |
| `/api/analysis` | GET | `ticker`, `lang` | 10 min | Full AI analysis orchestrator |
| `/api/promoter` | GET | `ticker` | 24 hr | BSE bulk deal scraper |
| `/api/news` | GET | `ticker` | 30 min | ET + Google News RSS |
| `/api/chat` | POST | body | — | Conversational Q&A proxy |

### ML Service (port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/health` | GET | Health + registered patterns |
| `/api/pattern` | POST | Chart pattern detection |
| `/api/confluence` | POST | 0–100 confluence score |
| `/api/sentiment` | POST | News sentiment classification |
| `/api/narrative` | POST | AI narrative generation |
| `/api/gemini-chat` | POST | Contextual Q&A |
| `/api/backtest/{pattern}` | GET | NSE historical stats |

---

## Detected Patterns

| Pattern | Direction | NSE Success Rate | Avg Gain | Avg Duration |
|---------|-----------|-----------------|----------|--------------|
| Cup & Handle | Bullish | 71% | +9.4% | 42 days |
| Double Bottom | Bullish | 67% | +8.1% | 35 days |
| Inverse Head & Shoulders | Bullish | 68% | +8.8% | 30 days |
| Head & Shoulders | Bearish | 63% | +7.3% | 28 days |
| Double Top | Bearish | 64% | +6.9% | 25 days |
| Support/Resistance Breakout | Bullish | 59% | +7.5% | 20 days |
| Bullish Flag | Bullish | 72% | +6.2% | 14 days |
| Falling Wedge | Bullish | 65% | +6.7% | 19 days |

---

## Project Structure

```
STOCK WHISPERER/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main app — homepage/analysis routing
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── index.jsx           # All components + hooks
│   │       ├── HomePage.jsx        # Landing page with hero + features
│   │       └── ImpactModel.jsx     # Business impact dashboard
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/
│   ├── main.py                     # FastAPI backend (port 8000)
│   ├── agents/
│   │   └── ml_service.py           # AI/ML service (port 8001)
│   ├── test_pattern.py
│   ├── test_confluence.py
│   ├── test_sentiment.py
│   ├── test_narrative.py
│   ├── test_chat.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   └── generate_docs.py            # Auto-generates arch doc + QA checklist
├── README.md
└── .gitignore
```

---

## Commit History

Built across 4 phases with 19 commits:

| Phase | Branch | Commits |
|-------|--------|---------|
| Phase 1 — Foundation | `phase/1-foundation` | Scaffold, yfinance, chart UI, ticker search |
| Phase 2 — Intelligence | `phase/2-intelligence` | Pattern engine, backtester, confluence score |
| Phase 3 — AI Layer | `phase/3-ai-layer` | Gemini agents, Hindi/Hinglish, Q&A chat |
| Phase 4 — Polish | `phase/4-polish` | Watchlist, impact model, README, UI redesign |

**Milestone tags:** `v0.1` (working MVP after Phase 2) · `v1.0` (submission-ready after Phase 4)

---

## Team

| Role | Responsibilities |
|------|----------------|
| Frontend Dev | Chart UI, ticker search, language toggle, Q&A chat, homepage |
| Backend Dev | FastAPI, yfinance, BSE scraper, caching layer, orchestrator |
| AI/ML Dev | Pattern engine, confluence score, Gemini agents, prompt tuning |
| Docs + QA | Architecture, impact model, README, pitch video, QA testing |

---

## Business Impact

| Metric | Value | Assumption |
|--------|-------|------------|
| ET Markets users | 3 Crore+ | Public disclosure |
| Weekly active (5%) | 15 Lakh | Conservative adoption |
| Time saved/user/week | 22 min | 30 min → 8 min research |
| Time value/month | ₹44 Crore | ₹200/hr avg value |
| New Prime subscribers | 30,000/yr | 2% conversion |
| Incremental revenue | ₹7.2 Cr/yr | ₹2,400/yr subscription |
| Tier-2/3 unlock | 5–8 Crore users | Hindi/Hinglish access |

---

## Disclaimer

This tool provides educational analysis only. It is not SEBI-registered investment advice. Please consult a registered financial advisor before making investment decisions.
