
STOCK WHISPERER — ARCHITECTURE DOCUMENT
Version 1.0 | ET Hackathon 2026
════════════════════════════════════════

LAYER 1 — FRONTEND (React + TailwindCSS + Vite)
───────────────────────────────────────────────
Components:
  ┌─────────────────────────────────────────┐
  │  TickerSearch  │  StockInfoCard          │
  ├─────────────────────────────────────────┤
  │       CandlestickChart (LW Charts)       │
  │       + Pattern Overlay Annotations      │
  ├─────────────────────────────────────────┤
  │  AnalysisCard                            │
  │  ┌──────────┬──────────┬──────────────┐ │
  │  │Confluence│ Pattern  │ Score Bars   │ │
  │  │  Score   │ Detected │ (6 signals)  │ │
  │  ├──────────┴──────────┴──────────────┤ │
  │  │        Narrative (EN/HI/Hinglish)  │ │
  │  ├────────────────────────────────────┤ │
  │  │     Conversational Q&A Chat UI     │ │
  │  └────────────────────────────────────┘ │
  ├─────────────────────────────────────────┤
  │  Watchlist (localStorage, 10 max)        │
  └─────────────────────────────────────────┘

Deployment: Vercel (auto-deploy on push to main)
State Management: React Query (server state) + useState (UI state)


LAYER 2 — BACKEND (FastAPI + Python 3.11)
──────────────────────────────────────────
REST Endpoints:
  GET  /api/search      → Symbol autocomplete (static JSON)
  GET  /api/quote       → Current price + fundamentals (yfinance)
  GET  /api/chart       → OHLCV candlestick data (yfinance)
  GET  /api/promoter    → BSE bulk deal scraper (BeautifulSoup)
  GET  /api/news        → ET/Google News RSS (feedparser)
  GET  /api/analysis    → Orchestrator — stitches all data
  POST /api/chat        → Proxy to AI/ML chat agent (hides API key)

Caching (in-memory TTL dict, upgradeable to Redis):
  /api/quote      → 2 min TTL
  /api/chart      → 15 min TTL
  /api/news       → 30 min TTL
  /api/promoter   → 24 hr TTL (daily cache)
  /api/analysis   → 10 min TTL

Error Handling:
  - Invalid ticker → 404 with helpful message
  - yfinance timeout → retry once, then graceful error card
  - BSE scraper blocked → return "No recent data" (non-fatal)
  - Gemini API error → show partial analysis (fallback text)

Deployment: Render or Railway (free tier)


LAYER 3 — AI/ML AGENT LAYER (FastAPI, separate service)
─────────────────────────────────────────────────────────
Agents:

  ┌─────────────────────────────────────────┐
  │           DATA AGENT (yfinance)          │
  │  Input: ticker symbol                    │
  │  Output: OHLCV DataFrame + indicators    │
  └──────────────┬──────────────────────────┘
                 │
  ┌──────────────▼──────────────────────────┐
  │         PATTERN AGENT (TA-Lib)           │
  │  Input: OHLCV DataFrame                  │
  │  Detects: 8 patterns (C&H, D-Bottom,    │
  │    H&S, Inv H&S, D-Top, Breakout,       │
  │    Bull/Bear Flag, Wedges)               │
  │  Output: pattern type + confidence       │
  │          + overlay coordinates           │
  └──────────────┬──────────────────────────┘
                 │
  ┌──────────────▼──────────────────────────┐
  │       CONFLUENCE SCORE ENGINE            │
  │  Inputs: pattern + RSI + MACD +          │
  │          volume + news + promoter        │
  │  Output: 0-100 score + breakdown         │
  └──────────────┬──────────────────────────┘
                 │
  ┌──────────────▼──────────────────────────┐
  │    NARRATIVE AGENT (Gemini 2.0 Flash)    │
  │  Input: all signals above                │
  │  Output: 3-4 sentence analysis           │
  │          in EN / HI / Hinglish           │
  └──────────────┬──────────────────────────┘
                 │
  ┌──────────────▼──────────────────────────┐
  │      Q&A AGENT (Gemini 2.0 Flash)        │
  │  Input: user question + full context     │
  │  Output: contextual answer               │
  │          in active language              │
  └─────────────────────────────────────────┘

External APIs / Data Sources:
  - Yahoo Finance (yfinance): OHLCV, fundamentals
  - BSE India website: bulk deals (scraped)
  - Google News RSS: headlines
  - ET Markets RSS: headlines
  - Gemini API (google-generativeai): all LLM tasks

API KEY SECURITY:
  Gemini API key is stored ONLY on the backend/AI service (.env file)
  It is never exposed to the frontend. The backend /api/chat endpoint
  acts as a secure proxy.
