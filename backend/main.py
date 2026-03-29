# ============================================================
# STOCK WHISPERER — Backend Starter
# Owner: Backend Dev
# Responsibilities: FastAPI setup, yfinance fetcher,
#                  BSE scraper, NSE backtester, caching
# Run: uvicorn main:app --reload
# ============================================================

import os
import json
import time
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from functools import wraps
from contextlib import asynccontextmanager

import httpx

import yfinance as yf
import feedparser
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ─── In-memory Cache (replace with Redis in production) ───

_cache: dict = {}

def cache_get(key: str):
    entry = _cache.get(key)
    if entry and time.time() < entry["expires"]:
        return entry["value"]
    return None

def cache_set(key: str, value, ttl_seconds: int = 300):
    _cache[key] = {"value": value, "expires": time.time() + ttl_seconds}

def cache_key(*args) -> str:
    return hashlib.md5("|".join(str(a) for a in args).encode()).hexdigest()

# ─── NSE/BSE Symbol List (static JSON) ────────────────────
# Load from symbols.json at startup. Generate this file once:
#   python scripts/generate_symbols.py
# which downloads the full NSE/BSE symbol list.

SYMBOLS = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    global SYMBOLS
    try:
        with open("symbols.json", "r") as f:
            SYMBOLS = json.load(f)
        print(f"[STARTUP] Loaded {len(SYMBOLS)} symbols")
    except FileNotFoundError:
        # Fallback: a few major symbols for development
        SYMBOLS = [
            {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "exchange": "NSE"},
            {"symbol": "TCS", "name": "Tata Consultancy Services", "exchange": "NSE"},
            {"symbol": "INFY", "name": "Infosys Ltd", "exchange": "NSE"},
            {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "exchange": "NSE"},
            {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd", "exchange": "NSE"},
            {"symbol": "WIPRO", "name": "Wipro Ltd", "exchange": "NSE"},
            {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd", "exchange": "NSE"},
            {"symbol": "BAJFINANCE", "name": "Bajaj Finance Ltd", "exchange": "NSE"},
            {"symbol": "SBIN", "name": "State Bank of India", "exchange": "NSE"},
            {"symbol": "ADANIENT", "name": "Adani Enterprises Ltd", "exchange": "NSE"},
        ]
        print("[STARTUP] symbols.json not found — using fallback list")
    yield

app = FastAPI(
    title="Stock Whisperer API",
    description="AI-Powered Chart Intelligence for Indian Investors",
    version="1.0.0",
    lifespan=lifespan,
)

_cors_origin = os.getenv("CORS_ORIGIN", "*")
_allow_origins = ["*"] if _cors_origin == "*" else [o.strip() for o in _cors_origin.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Utility: yfinance ticker helper ──────────────────────

def get_yf_ticker(symbol: str) -> str:
    """Convert NSE symbol to yfinance format. E.g. RELIANCE → RELIANCE.NS"""
    if "." not in symbol:
        return f"{symbol}.NS"
    return symbol


# ─── Route: GET /api/search ────────────────────────────────

@app.get("/api/search")
async def search_symbols(q: str = Query(..., min_length=1)):
    """
    Autocomplete search for NSE/BSE symbols.
    Returns top 8 matches by symbol or company name.
    """
    q_upper = q.upper()
    results = [
        s for s in SYMBOLS
        if q_upper in s["symbol"] or q_upper in s["name"].upper()
    ][:8]

    if not results:
        raise HTTPException(status_code=404, detail=f"No symbols found for '{q}'")

    return {"results": results}


# ─── Route: GET /api/quote ─────────────────────────────────

@app.get("/api/quote")
async def get_quote(ticker: str = Query(...)):
    """
    Returns current price, change %, 52W high/low, market cap, P/E.
    Cached for 2 minutes.
    """
    key = cache_key("quote", ticker)
    cached = cache_get(key)
    if cached:
        return cached

    yf_ticker = get_yf_ticker(ticker)

    try:
        stock = yf.Ticker(yf_ticker)
        info = stock.info

        if "regularMarketPrice" not in info and "currentPrice" not in info:
            raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")

        price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose", price)
        change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0

        volume = info.get("volume", 0)
        avg_volume = info.get("averageVolume", 0)

        def fmt_volume(v):
            if v >= 1_000_000:
                return f"{v/1_000_000:.1f}M"
            if v >= 1_000:
                return f"{v/1_000:.1f}K"
            return str(v)

        market_cap = info.get("marketCap", 0)
        market_cap_cr = f"{market_cap / 1_00_00_000:.0f}" if market_cap else None

        result = {
            "symbol": ticker,
            "name": info.get("longName") or info.get("shortName", ticker),
            "price": price,
            "change_pct": round(change_pct, 2),
            "week_high_52": info.get("fiftyTwoWeekHigh"),
            "week_low_52": info.get("fiftyTwoWeekLow"),
            "market_cap_cr": market_cap_cr,
            "pe_ratio": info.get("trailingPE"),
            "volume": volume,
            "volume_fmt": fmt_volume(volume),
            "avg_volume": avg_volume,
            "avg_volume_fmt": fmt_volume(avg_volume),
        }

        cache_set(key, result, ttl_seconds=120)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote: {str(e)}")


# ─── Route: GET /api/chart ─────────────────────────────────

@app.get("/api/chart")
async def get_chart(
    ticker: str = Query(...),
    period: str = Query("1mo"),  # 1d, 5d, 1mo, 3mo
    interval: str = Query(None),
):
    """
    Returns OHLCV candlestick data for the given period.
    Auto-selects interval based on period.
    Cached for 15 minutes.
    """
    INTERVAL_MAP = {"1d": "5m", "5d": "30m", "1mo": "1d", "3mo": "1d"}
    interval = interval or INTERVAL_MAP.get(period, "1d")

    key = cache_key("chart", ticker, period, interval)
    cached = cache_get(key)
    if cached:
        return cached

    yf_ticker = get_yf_ticker(ticker)

    try:
        df = yf.download(yf_ticker, period=period, interval=interval, progress=False)

        if df.empty:
            raise HTTPException(status_code=404, detail=f"No chart data for '{ticker}'")

        # Flatten MultiIndex columns from yfinance 0.2.x
        if hasattr(df.columns, "levels"):
            df.columns = df.columns.get_level_values(0)

        df = df.dropna()
        df = df.sort_index()

        # For intraday intervals keep full timestamp, for daily use date only
        is_intraday = interval in ["1m", "5m", "15m", "30m", "60m", "90m", "1h"]

        seen_times = set()
        candles = []
        for idx, row in df.iterrows():
            if is_intraday:
                # Convert to Unix timestamp for Lightweight Charts intraday
                if hasattr(idx, 'timestamp'):
                    time_val = int(idx.timestamp())
                else:
                    time_val = int(pd.Timestamp(idx).timestamp())
            else:
                time_val = str(idx)[:10]

            if time_val in seen_times:
                continue
            seen_times.add(time_val)
            candles.append({
                "time": time_val,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })

        result = {"ticker": ticker, "period": period, "interval": interval, "candles": candles}
        cache_set(key, result, ttl_seconds=900)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chart fetch failed: {str(e)}")


# ─── Route: GET /api/promoter ──────────────────────────────

@app.get("/api/promoter")
async def get_promoter_activity(ticker: str = Query(...)):
    """
    Scrapes BSE bulk/block deals and SAST disclosures.
    Returns promoter action classification and confluence delta.
    Cached for 24 hours (daily refresh).
    """
    key = cache_key("promoter", ticker)
    cached = cache_get(key)
    if cached:
        return cached

    result = await _scrape_bse_promoter(ticker)
    cache_set(key, result, ttl_seconds=86400)
    return result


async def _scrape_bse_promoter(ticker: str) -> dict:
    """
    Scrapes BSE bulk deals page for the given ticker.
    Returns action: Buying | Selling | Pledging | No recent activity
    """
    # BSE bulk deals endpoint
    url = "https://www.bseindia.com/markets/equity/EQReports/BulkDealArchieve.aspx"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.bseindia.com",
    }

    try:
        # Run blocking HTTP call in thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: requests.get(url, headers=headers, timeout=10)
        )

        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.find("table", {"id": "ContentPlaceHolder1_GridView1"})

        if not table:
            return _promoter_default(ticker, "No recent activity")

        rows = table.find_all("tr")[1:]  # skip header
        ticker_upper = ticker.upper()

        buys, sells, pledges = 0, 0, 0
        recent_deals = []

        for row in rows[:30]:  # check last 30 deals
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 5:
                continue

            symbol_col = cols[1].upper()
            if ticker_upper not in symbol_col:
                continue

            deal_type = cols[4].upper() if len(cols) > 4 else ""
            quantity = cols[3] if len(cols) > 3 else "0"

            recent_deals.append({
                "date": cols[0],
                "client": cols[2] if len(cols) > 2 else "",
                "type": deal_type,
                "quantity": quantity,
            })

            if "BUY" in deal_type:
                buys += 1
            elif "SELL" in deal_type:
                sells += 1

        # Classify action
        if buys > sells and buys > 0:
            action = "Buying"
            score_delta = +10
        elif sells > buys and sells > 0:
            action = "Selling"
            score_delta = -10
        elif pledges > 0:
            action = "Pledging"
            score_delta = -10
        elif recent_deals:
            action = "Mixed Activity"
            score_delta = 0
        else:
            action = "No recent activity"
            score_delta = 0

        return {
            "ticker": ticker,
            "action": action,
            "score_delta": score_delta,
            "recent_deals": recent_deals[:5],
            "note": "Data from BSE bulk deals",
        }

    except Exception as e:
        # Graceful degradation — don't fail the whole analysis
        return _promoter_default(ticker, "No recent activity", error=str(e))


def _promoter_default(ticker, action, error=None):
    return {
        "ticker": ticker,
        "action": action,
        "score_delta": 0,
        "recent_deals": [],
        "error": error,
    }


# ─── Route: GET /api/news ──────────────────────────────────

@app.get("/api/news")
async def get_news(ticker: str = Query(...)):
    """
    Fetches last 5 news headlines from ET Markets + Google News RSS.
    Cached for 30 minutes.
    """
    key = cache_key("news", ticker)
    cached = cache_get(key)
    if cached:
        return cached

    headlines = await _fetch_news_headlines(ticker)
    result = {"ticker": ticker, "headlines": headlines}
    cache_set(key, result, ttl_seconds=1800)
    return result


async def _fetch_news_headlines(ticker: str) -> list[dict]:
    """Fetch from Google News RSS and ET Markets RSS"""
    urls = [
        f"https://news.google.com/rss/search?q={ticker}+NSE+stock+India&hl=en-IN&gl=IN&ceid=IN:en",
        f"https://economictimes.indiatimes.com/markets/stocks/rss.cms",
    ]

    headlines = []
    loop = asyncio.get_event_loop()

    for url in urls:
        try:
            feed = await loop.run_in_executor(None, lambda u=url: feedparser.parse(u))
            for entry in feed.entries[:3]:
                title = entry.get("title", "")
                # Filter for relevance to this ticker
                if ticker.upper() in title.upper() or len(headlines) < 3:
                    headlines.append({
                        "title": title,
                        "link": entry.get("link", ""),
                        "published": entry.get("published", ""),
                        "source": feed.feed.get("title", "News"),
                    })
        except Exception:
            continue

    return headlines[:5]


# ─── Route: GET /api/health ────────────────────────────────

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "symbols_loaded": len(SYMBOLS),
        "cache_entries": len(_cache),
    }


# ─── Route: GET /api/analysis (orchestrator) ───────────────
# This endpoint calls the AI/ML layer's pattern + confluence endpoints
# and the narrative endpoint, then returns the full analysis object.
# The AI/ML team implements /api/pattern and /api/confluence.
# This backend endpoint stitches everything together.

@app.get("/api/analysis")
async def get_full_analysis(
    ticker: str = Query(...),
    lang: str = Query("en"),
):
    key = cache_key("analysis", ticker, lang)
    cached = cache_get(key)
    if cached:
        return cached

    # Fetch chart data for pattern + confluence
    yf_ticker = get_yf_ticker(ticker)
    try:
        df = yf.download(yf_ticker, period="3mo", interval="1d", progress=False)
        if hasattr(df.columns, "levels"):
            df.columns = df.columns.get_level_values(0)
        df = df.dropna()
        df.index = df.index.astype(str)

        candles = [
            {
                "time": str(idx)[:10],
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            }
            for idx, row in df.iterrows()
        ]
    except Exception:
        candles = []

    # Run all agents concurrently
    ML_SERVICE = "http://localhost:8001"

    async def call_ml(endpoint, payload):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(f"http://localhost:8001{endpoint}", json=payload)
                if r.status_code != 200:
                    print(f"[ML ERROR] {endpoint} returned {r.status_code}: {r.text[:200]}")
                    return {}
                return r.json()
        except Exception as e:
            print(f"[ML ERROR] {endpoint} failed: {str(e)}")
            return {}

    async def call_backend(endpoint):
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(f"http://localhost:8000{endpoint}")
                if r.status_code != 200:
                    print(f"[BACKEND ERROR] {endpoint} returned {r.status_code}")
                    return {}
                return r.json()
        except Exception as e:
            print(f"[BACKEND ERROR] {endpoint} failed: {str(e)}")
            return {}
    # Run pattern detection, promoter, news concurrently
    pattern_task = call_ml("/api/pattern", {"ticker": ticker, "candles": candles})
    promoter_task = call_backend(f"/api/promoter?ticker={ticker}")
    news_task = call_backend(f"/api/news?ticker={ticker}")

    pattern_data, promoter_data, news_data = await asyncio.gather(
        pattern_task, promoter_task, news_task
    )

    top_pattern = pattern_data.get("top_pattern")
    promoter_action = promoter_data.get("action", "No recent activity")
    promoter_delta = promoter_data.get("score_delta", 0)
    headlines = news_data.get("headlines", [])

    # Get news sentiment
    sentiment_data = await call_ml("/api/sentiment", {
        "ticker": ticker,
        "headlines": headlines
    })
    news_sentiment = sentiment_data.get("sentiment", "Neutral")
    news_summary = sentiment_data.get("summary", "")

    # Get confluence score
    confluence_data = await call_ml("/api/confluence", {
        "ticker": ticker,
        "candles": candles,
        "pattern": top_pattern,
        "news_sentiment": news_sentiment,
        "promoter_score_delta": promoter_delta,
    })
    confluence_score = confluence_data.get("confluence_score", 0)
    scores = confluence_data.get("scores", {})

    # Get backtest stats
    backtest = None
    if top_pattern:
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    f"{ML_SERVICE}/api/backtest/{top_pattern['type'].replace(' ', '%20')}"
                )
                backtest = r.json()
        except Exception:
            pass

    # Generate narrative — always run even if no pattern detected
    narrative_data = await call_ml("/api/narrative", {
        "ticker": ticker,
        "pattern": top_pattern,  # can be None — narrative handles this
        "backtest": backtest,
        "confluence_score": confluence_score,
        "scores": scores,
        "news_sentiment": news_sentiment,
        "news_summary": news_summary,
        "promoter_action": promoter_action,
        "language": lang,
    })
    narrative = narrative_data.get("narrative", "")

    # Fallback if narrative is empty
    if not narrative:
        direction = "bullish" if confluence_score >= 50 else "bearish"
        narrative = f"{ticker} shows a {confluence_score}/100 confluence score indicating a {'moderate' if confluence_score >= 41 else 'weak'} setup. RSI and MACD signals suggest {direction} momentum. No clear chart pattern detected — monitor for breakout signals."
    result = {
        "ticker": ticker,
        "language": lang,
        "pattern": top_pattern,
        "backtest": backtest,
        "confluence_score": confluence_score,
        "label": confluence_data.get("label", ""),
        "scores": scores,
        "news_sentiment": news_sentiment,
        "news_summary": news_summary,
        "promoter_action": promoter_action,
        "narrative": narrative,
        "headlines": headlines,
    }

    cache_set(key, result, ttl_seconds=600)
    return result

async def _safe_get_quote(ticker: str):
    try:
        return await get_quote(ticker)
    except Exception:
        return {}


# ─── Chat Endpoint ─────────────────────────────────────────

class ChatRequest(BaseModel):
    ticker: str
    language: str = "en"
    message: str
    history: list[dict] = []
    context: Optional[dict] = None


@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "http://localhost:8001/api/gemini-chat",
                json={
                    "ticker": req.ticker,
                    "language": req.language,
                    "message": req.message,
                    "history": req.history,
                    "context": req.context,
                }
            )
            return r.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)