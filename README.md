# 📈 Stock Whisperer
### AI-Powered Chart Intelligence for Indian Investors
> ET AI Hackathon 2026 | Problem Statement 6: AI for the Indian Investor

---

## What It Does
Stock Whisperer detects chart patterns on NSE/BSE stocks, back-tests them against 3 years of Indian market data, and synthesizes technical signals, news sentiment, and promoter activity into a single **Confluence Score** — delivered as plain-language analysis in English, Hindi, or Hinglish.

## Architecture
```
Frontend (React + Vite + TailwindCSS)  →  Vercel
Backend (FastAPI + Python 3.11)         →  Render
AI/ML Service (FastAPI + Gemini 2.5)    →  Render
```

## Setup Instructions

### Prerequisites
- Node.js 20+
- Python 3.12+
- Gemini API key — https://aistudio.google.com

### 1. Clone
```bash
git clone https://github.com/HarshSharma9026/stock-whisperer.git
cd stock-whisperer
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add GEMINI_API_KEY to .env
uvicorn main:app --reload
# → http://localhost:8000
```

### 3. AI/ML Service
```bash
# New terminal, from /backend with venv active
uvicorn agents.ml_service:app --port 8001 --reload
# → http://localhost:8001
```

### 4. Frontend
```bash
cd frontend
npm install
# Create .env.local with: VITE_API_URL=http://localhost:8000
npm run dev
# → http://localhost:5173
```

## Key Features
| Feature | Description |
|---------|-------------|
| 🎯 Confluence Score | 0–100 score combining 6 signals |
| 📐 Pattern Detection | 8 chart patterns with NSE backtesting |
| 🗣️ Hindi / Hinglish | First stock analysis tool in Indian languages |
| 💬 Q&A Chat | Ask follow-up questions in any language |
| 📊 NSE Backtest | 3-year historical success rates per pattern |
| 📰 News Sentiment | Real-time ET Markets + Google News classification |
| 🏢 Promoter Activity | BSE bulk deal scraper integrated into score |

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | GET | NSE/BSE symbol autocomplete |
| `/api/quote` | GET | Live price + fundamentals |
| `/api/chart` | GET | OHLCV candlestick data |
| `/api/analysis` | GET | Full AI analysis orchestrator |
| `/api/promoter` | GET | BSE bulk deal scraper |
| `/api/news` | GET | ET + Google News RSS |
| `/api/chat` | POST | Conversational Q&A proxy |

## Team
| Role | Responsibilities |
|------|----------------|
| Frontend Dev | Chart UI, ticker search, language toggle, Q&A chat |
| Backend Dev | FastAPI, yfinance, BSE scraper, caching layer |
| AI/ML Dev | Pattern engine, confluence score, Gemini agents |
| Docs + QA | Architecture, impact model, README, pitch video |

## Commit History
Built across 4 phases with 18 commits — see branch history for full build progression.
- `phase/1-foundation` — Scaffold, data pipeline, chart UI
- `phase/2-intelligence` — Pattern detection, backtester, confluence score
- `phase/3-ai-layer` — Gemini agents, Hindi/Hinglish, Q&A chat
- `phase/4-polish` — Watchlist, impact model, README, polish

## Disclaimer
This tool provides educational analysis only. It is not SEBI-registered investment advice.