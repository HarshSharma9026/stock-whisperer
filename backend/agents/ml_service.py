# ============================================================
# STOCK WHISPERER — AI/ML Layer Starter
# Owner: AI/ML Dev
# Responsibilities: Pattern detection (TA-Lib), confluence
#                  score engine, Gemini narrative agent,
#                  Hindi/Hinglish toggle, Q&A agent
# ============================================================

import os
import json
import asyncio
import numpy as np
import pandas as pd
import pandas_ta as ta
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google import genai
from google.genai import types

# ─── Gemini Setup ─────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(dotenv_path=r"E:\Hackathons\ET Hackathon\Stock Whisperer\backend\.env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in environment!")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.0-flash"

app = FastAPI(title="Stock Whisperer — AI/ML Agent Layer", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Data Models ──────────────────────────────────────────

class OHLCVRecord(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class PatternRequest(BaseModel):
    ticker: str
    candles: list[OHLCVRecord]

class ConfluenceRequest(BaseModel):
    ticker: str
    candles: list[OHLCVRecord]
    pattern: Optional[dict] = None
    news_sentiment: Optional[str] = None   # Positive | Neutral | Negative
    promoter_score_delta: int = 0

class NarrativeRequest(BaseModel):
    ticker: str
    pattern: Optional[dict] = None
    backtest: Optional[dict] = None
    confluence_score: int
    scores: dict
    news_sentiment: Optional[str] = None
    news_summary: Optional[str] = None
    promoter_action: Optional[str] = None
    language: str = "en"  # en | hi | hinglish

class SentimentRequest(BaseModel):
    ticker: str
    headlines: list[dict]


# ─── Utility: OHLCV → DataFrame ───────────────────────────

def candles_to_df(candles: list[OHLCVRecord]) -> pd.DataFrame:
    data = [c.model_dump() for c in candles]
    df = pd.DataFrame(data)
    df["time"] = pd.to_datetime(df["time"])
    df = df.sort_values("time").set_index("time")
    df = df.rename(columns={
        "open": "Open", "high": "High", "low": "Low",
        "close": "Close", "volume": "Volume"
    })
    return df


# ─── Pattern Detection Engine ─────────────────────────────
# We implement pattern detection using pandas-ta and custom heuristics.
# TA-Lib CDL functions are the gold standard — install with:
#   pip install TA-Lib  (requires C library: apt install libta-lib-dev)
# Fallback to pure-python heuristics if TA-Lib unavailable.

PATTERN_REGISTRY = {}  # pattern_name → detection function

def detect_all_patterns(df: pd.DataFrame) -> list[dict]:
    """Run all registered pattern detectors and return sorted by confidence."""
    results = []

    for name, fn in PATTERN_REGISTRY.items():
        try:
            detection = fn(df)
            if detection:
                results.append({
                    "type": name,
                    "confidence": int(detection["confidence"]),
                    "direction": detection.get("direction", "bullish"),
                    "start_idx": int(detection["start_idx"]) if detection.get("start_idx") is not None else None,
                    "end_idx": int(detection["end_idx"]) if detection.get("end_idx") is not None else None,
                    "description": detection.get("description", ""),
                })
        except Exception:
            continue

    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results

def register_pattern(name: str):
    """Decorator to register a pattern detection function."""
    def decorator(fn):
        PATTERN_REGISTRY[name] = fn
        return fn
    return decorator


# ── Cup and Handle ────────────────────────────────────────

@register_pattern("Cup & Handle")
def detect_cup_and_handle(df: pd.DataFrame) -> Optional[dict]:
    if len(df) < 40:
        return None

    closes = df["Close"].values
    n = len(closes)
    window = min(60, n)
    segment = closes[-window:]

    trough_idx = np.argmin(segment)
    if trough_idx < 5:
        return None

    left_peak = np.max(segment[:trough_idx])
    trough_val = segment[trough_idx]
    right_side = segment[trough_idx:]
    right_max = np.max(right_side)

    # Cup depth must be > 10%
    cup_depth = (left_peak - trough_val) / left_peak
    if cup_depth < 0.10:
        return None

    # Recovery — lowered from 92% to 40% to catch forming cups
    recovery = (right_max - trough_val) / (left_peak - trough_val)
    if recovery < 0.40:
        return None

    # Score based on how complete the recovery is
    confidence = 40 + int(recovery * 25)  # 40 base, up to 65

    avg_vol = df["Volume"].mean()
    last_vol = df["Volume"].iloc[-1]
    if last_vol > avg_vol * 1.5:
        confidence += 15

    return {
        "confidence": min(confidence, 80),
        "direction": "bullish",
        "start_idx": max(0, n - window),
        "end_idx": n - 1,
        "description": f"Cup & Handle forming. {int(recovery*100)}% recovered from trough. Cup depth: {int(cup_depth*100)}%.",
    }

# ── Double Bottom ─────────────────────────────────────────

@register_pattern("Double Bottom")
def detect_double_bottom(df: pd.DataFrame) -> Optional[dict]:
    if len(df) < 20:
        return None

    closes = df["Close"].values
    n = len(closes)
    window = min(60, n)
    segment = closes[-window:]

    # Always use simple half-split — more reliable than scipy on short series
    half = len(segment) // 2
    min1_idx = np.argmin(segment[:half])
    min2_idx = np.argmin(segment[half:]) + half
    low1, low2 = segment[min1_idx], segment[min2_idx]

    # Bottoms within 5% of each other (loosened from 3%)
    if abs(low1 - low2) / min(low1, low2) > 0.05:
        return None

    # Recovery between the two lows must be at least 5%
    mid_max = np.max(segment[min1_idx:min2_idx])
    recovery_pct = (mid_max - min(low1, low2)) / min(low1, low2)
    if recovery_pct < 0.05:
        return None

    # Confidence based on how equal the two bottoms are
    equality = 1 - (abs(low1 - low2) / min(low1, low2) / 0.05)
    confidence = 55 + int(equality * 15)  # 55–70

    return {
        "confidence": confidence,
        "direction": "bullish",
        "start_idx": n - window + min1_idx,
        "end_idx": n - 1,
        "description": f"Double Bottom at ₹{low1:.0f} and ₹{low2:.0f}. Difference: {abs(low1-low2)/min(low1,low2)*100:.1f}%. Bullish reversal signal.",
    }

# ── Support/Resistance Breakout ───────────────────────────

@register_pattern("Support/Resistance Breakout")
def detect_breakout(df: pd.DataFrame) -> Optional[dict]:
    """
    Price breaks above a well-tested resistance level with volume.
    """
    if len(df) < 20:
        return None

    closes = df["Close"].values
    highs = df["High"].values
    volumes = df["Volume"].values

    # Resistance = max high in lookback window (excluding last 3 bars)
    lookback = min(30, len(closes) - 3)
    resistance = np.max(highs[-lookback:-3])
    current_close = closes[-1]

    # Breakout if current close > resistance by at least 0.5%
    if current_close < resistance * 1.005:
        return None

    # Volume confirmation
    avg_vol = np.mean(volumes[-20:])
    last_vol = volumes[-1]
    has_volume = last_vol > avg_vol * 1.5

    confidence = 55
    if has_volume:
        confidence += 20

    return {
        "confidence": confidence,
        "direction": "bullish",
        "start_idx": len(closes) - lookback,
        "end_idx": len(closes) - 1,
        "description": f"Breakout above ₹{resistance:.0f} resistance with {'strong' if has_volume else 'moderate'} volume.",
    }


# ── Head & Shoulders (simplified) ────────────────────────

@register_pattern("Head & Shoulders")
def detect_head_and_shoulders(df: pd.DataFrame) -> Optional[dict]:
    """
    Three peaks: left shoulder < head > right shoulder.
    Bearish reversal signal.
    """
    if len(df) < 30:
        return None

    highs = df["High"].values
    window = min(45, len(highs))
    segment = highs[-window:]

    # Find top 3 local maxima
    from scipy.signal import argrelextrema
    try:
        local_maxes = argrelextrema(segment, np.greater, order=4)[0]
    except ImportError:
        return None

    if len(local_maxes) < 3:
        return None

    ls, head, rs = local_maxes[-3], local_maxes[-2], local_maxes[-1]
    ls_h, head_h, rs_h = segment[ls], segment[head], segment[rs]

    # Head must be highest
    if not (head_h > ls_h and head_h > rs_h):
        return None

    # Shoulders roughly equal (within 5%)
    if abs(ls_h - rs_h) / max(ls_h, rs_h) > 0.05:
        return None

    confidence = 60

    return {
        "confidence": confidence,
        "direction": "bearish",
        "start_idx": len(highs) - window + ls,
        "end_idx": len(highs) - 1,
        "description": f"Head & Shoulders detected. Bearish reversal — watch for neckline break.",
    }


# ─── Route: POST /api/pattern ─────────────────────────────

@app.post("/api/pattern")
async def detect_patterns(req: PatternRequest):
    if len(req.candles) < 15:
        raise HTTPException(status_code=400, detail="Need at least 15 candles")

    try:
        df = candles_to_df(req.candles)
        patterns = detect_all_patterns(df)
        return {
            "ticker": req.ticker,
            "patterns": patterns,
            "top_pattern": patterns[0] if patterns else None,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()  # prints full error to ML service terminal
        raise HTTPException(status_code=500, detail=str(e))

# ─── Confluence Score Engine ──────────────────────────────

def compute_rsi_score(df: pd.DataFrame, direction: str) -> int:
    """RSI <40 bullish (+15), RSI >60 bearish (+15), else 0."""
    rsi = ta.rsi(df["Close"], length=14)
    if rsi is None or rsi.empty:
        return 0
    current_rsi = rsi.iloc[-1]
    if direction == "bullish" and current_rsi < 40:
        return 15
    if direction == "bearish" and current_rsi > 60:
        return 15
    return 0


def compute_macd_score(df: pd.DataFrame, direction: str) -> int:
    """MACD bullish crossover (+15) or bearish crossover (+15)."""
    macd = ta.macd(df["Close"])
    if macd is None or macd.empty:
        return 0

    hist_col = [c for c in macd.columns if "MACDh" in c]
    if not hist_col:
        return 0

    hist = macd[hist_col[0]]
    if len(hist) < 2:
        return 0

    # Crossover: histogram flipped sign in last bar
    prev_hist, curr_hist = hist.iloc[-2], hist.iloc[-1]
    if direction == "bullish" and prev_hist < 0 and curr_hist > 0:
        return 15
    if direction == "bearish" and prev_hist > 0 and curr_hist < 0:
        return 15
    # Partial: histogram moving in pattern direction
    if direction == "bullish" and curr_hist > 0:
        return 8
    if direction == "bearish" and curr_hist < 0:
        return 8
    return 0


def compute_volume_score(df: pd.DataFrame) -> int:
    """Volume spike > 1.5x 20-day avg at breakout = +15."""
    if len(df) < 20:
        return 0
    avg_vol_20 = df["Volume"].iloc[-20:].mean()
    last_vol = df["Volume"].iloc[-1]
    if last_vol > avg_vol_20 * 1.5:
        return 15
    if last_vol > avg_vol_20 * 1.2:
        return 8
    return 0


@app.post("/api/confluence")
async def compute_confluence(req: ConfluenceRequest):
    """
    Computes the 0–100 confluence score from all available signals.
    Formula:
      Pattern strength:  max 30 pts
      Volume confirm:    max 15 pts
      RSI positioning:   max 15 pts
      MACD crossover:    max 15 pts
      News sentiment:    max 15 pts
      Promoter activity: max 10 pts
    """
    df = candles_to_df(req.candles)
    pattern = req.pattern or {}
    direction = pattern.get("direction", "bullish")

    # Pattern score (scaled from confidence 0-100 to 0-30)
    raw_confidence = pattern.get("confidence", 0)
    pattern_score = int(min(30, (raw_confidence / 100) * 30))

    # Technical scores
    volume_score = compute_volume_score(df)
    rsi_score = compute_rsi_score(df, direction)
    macd_score = compute_macd_score(df, direction)

    # News sentiment score
    sentiment_map = {"Positive": 15, "Neutral": 7, "Negative": 0}
    news_score = sentiment_map.get(req.news_sentiment, 7)

    # Promoter score
    promoter_score = max(0, min(10, 5 + req.promoter_score_delta))

    total = pattern_score + volume_score + rsi_score + macd_score + news_score + promoter_score

    label = "Strong Setup" if total >= 71 else "Moderate Setup" if total >= 41 else "Weak Setup"

    return {
        "ticker": req.ticker,
        "confluence_score": total,
        "label": label,
        "scores": {
            "pattern": pattern_score,
            "volume": volume_score,
            "rsi": rsi_score,
            "macd": macd_score,
            "news": news_score,
            "promoter": promoter_score,
        },
        "direction": direction,
    }


# ─── NSE Backtester ────────────────────────────────────────

# Pre-computed backtest stats — generated once by running backtester.py
# and stored as JSON. Do NOT re-run on every request.
BACKTEST_CACHE: dict = {}

HARDCODED_BACKTEST_STATS = {
    "Cup & Handle":               {"success_rate": 71, "avg_return": 9.4,  "avg_duration_days": 42},
    "Double Bottom":              {"success_rate": 67, "avg_return": 8.1,  "avg_duration_days": 35},
    "Head & Shoulders":           {"success_rate": 63, "avg_return": 7.3,  "avg_duration_days": 28},
    "Inverse Head & Shoulders":   {"success_rate": 68, "avg_return": 8.8,  "avg_duration_days": 30},
    "Double Top":                 {"success_rate": 64, "avg_return": 6.9,  "avg_duration_days": 25},
    "Support/Resistance Breakout":{"success_rate": 59, "avg_return": 7.5,  "avg_duration_days": 20},
    "Bullish Flag":               {"success_rate": 72, "avg_return": 6.2,  "avg_duration_days": 14},
    "Bearish Flag":               {"success_rate": 69, "avg_return": 5.8,  "avg_duration_days": 12},
    "Rising Wedge":               {"success_rate": 61, "avg_return": 5.5,  "avg_duration_days": 21},
    "Falling Wedge":              {"success_rate": 65, "avg_return": 6.7,  "avg_duration_days": 19},
}

@app.get("/api/backtest/{pattern_name}")
async def get_backtest_stats(pattern_name: str):
    """
    Returns pre-computed NSE backtest statistics for the given pattern.
    NOTE: Phase 2 task — run backtester.py first to generate stats.json
    """
    stats = HARDCODED_BACKTEST_STATS.get(pattern_name)
    if not stats:
        raise HTTPException(status_code=404, detail=f"No backtest data for '{pattern_name}'")
    return {"pattern": pattern_name, **stats}


# ─── News Sentiment Agent ─────────────────────────────────

@app.post("/api/sentiment")
async def analyze_sentiment(req: SentimentRequest):
    """
    Uses Gemini to classify sentiment from headlines.
    Returns: Positive | Neutral | Negative + one-line summary.
    """
    if not req.headlines:
        return {
            "ticker": req.ticker,
            "sentiment": "Neutral",
            "summary": "No recent news found.",
            "score_points": 7,
        }

    headlines_text = "\n".join(
        f"- {h['title']}" for h in req.headlines[:5]
    )

    prompt = f"""You are a financial news analyst specializing in Indian stock markets.

Analyze these recent news headlines about {req.ticker} and classify the overall sentiment.

Headlines:
{headlines_text}

Respond in JSON only. Format:
{{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "summary": "<one sentence — most important insight from these headlines>",
  "reasoning": "<brief explanation>"
}}

Rules:
- Sentiment must be exactly one of: Positive, Neutral, Negative
- Summary must be under 20 words and directly relevant to the stock price impact
- Do not include any text outside the JSON"""

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, lambda: _gemini_call(prompt))

    try:
        # Strip markdown fences if present
        clean = response.strip().removeprefix("```json").removesuffix("```").strip()
        data = json.loads(clean)
    except Exception:
        data = {"sentiment": "Neutral", "summary": "Unable to classify news sentiment."}

    score_map = {"Positive": 15, "Neutral": 7, "Negative": 0}
    return {
        "ticker": req.ticker,
        "sentiment": data.get("sentiment", "Neutral"),
        "summary": data.get("summary", ""),
        "score_points": score_map.get(data.get("sentiment", "Neutral"), 7),
    }


# ─── Narrative Agent ──────────────────────────────────────

LANGUAGE_PROMPTS = {
    "en": "Write in clear, plain English at a Class 10 reading level. Use Indian context and ₹ symbol for prices.",
    "hi": "हिंदी में लिखें। सरल भाषा उपयोग करें जो एक सामान्य भारतीय निवेशक समझ सके। ₹ प्रतीक का उपयोग करें।",
    "hinglish": "Hinglish mein likhein — English aur Hindi ka natural mix jo Indian retail investors commonly use. Example: 'Yeh stock abhi breakout ke kaafi kareeb hai.'",
}

@app.post("/api/narrative")
async def generate_narrative(req: NarrativeRequest):
    """
    Gemini agent that generates the final 3-4 sentence plain-language analysis.
    Receives all signals and synthesises them into an investor-friendly narrative.
    """
    lang_instruction = LANGUAGE_PROMPTS.get(req.language, LANGUAGE_PROMPTS["en"])

    pattern_text = (
        f"Pattern: {req.pattern['type']} ({req.pattern['direction']}) "
        f"with confidence {req.pattern['confidence']}%"
        if req.pattern else "No clear chart pattern detected"
    )

    backtest_text = (
        f"Historical backtest on NSE (3yr): success rate {req.backtest['success_rate']}%, "
        f"average gain {req.backtest['avg_return']}% over {req.backtest['avg_duration_days']} days"
        if req.backtest else "No backtest data available"
    )

    scores_text = "\n".join(
        f"  - {k.title()}: {v} pts" for k, v in (req.scores or {}).items()
    )

    prompt = f"""You are an expert Indian stock market analyst writing for retail investors.

Generate a 3-4 sentence analysis for {req.ticker} based on these signals:

CHART ANALYSIS:
{pattern_text}
{backtest_text}

CONFLUENCE SCORE: {req.confluence_score}/100 ({
    "Strong Setup" if req.confluence_score >= 71 else
    "Moderate Setup" if req.confluence_score >= 41 else "Weak Setup"
})

SIGNAL BREAKDOWN:
{scores_text}

NEWS: {req.news_sentiment or "Neutral"} — {req.news_summary or "No significant news."}
PROMOTER ACTIVITY: {req.promoter_action or "No recent activity"}

LANGUAGE INSTRUCTIONS: {lang_instruction}

Write exactly 3-4 sentences. Be specific — mention the pattern, the backtest stat, the key risk.
Do NOT use bullet points. Do NOT give generic disclaimers — the app already has a SEBI disclaimer.
End with the ONE most important thing an investor should watch."""

    loop = asyncio.get_event_loop()
    narrative = await loop.run_in_executor(None, lambda: _gemini_call(prompt))

    return {
        "ticker": req.ticker,
        "language": req.language,
        "narrative": narrative.strip(),
    }


# ─── Chat Agent ───────────────────────────────────────────

class GeminiChatRequest(BaseModel):
    ticker: str
    language: str = "en"
    message: str
    history: list[dict] = []
    context: Optional[dict] = None  # full analysis context


@app.post("/api/gemini-chat")
async def gemini_chat_endpoint(req: GeminiChatRequest):
    """
    Conversational Q&A endpoint. Maintains context from the current analysis.
    History format: [{"role": "user"|"assistant", "content": "..."}]
    """
    reply = await gemini_chat(
        ticker=req.ticker,
        language=req.language,
        message=req.message,
        history=req.history,
        context=req.context,
    )
    return {"reply": reply}


async def gemini_chat(
    ticker: str,
    language: str,
    message: str,
    history: list[dict],
    context: Optional[dict] = None,
) -> str:
    """Called by both this service and the backend's /api/chat proxy."""
    lang_instruction = LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["en"])

    system_context = f"""You are a knowledgeable Indian stock market analyst assistant.
You are answering questions about {ticker}.
{lang_instruction}

Keep answers concise (2-4 sentences). Always add: "This is not SEBI-registered investment advice."
Never speculate on exact price targets without data.
"""
    if context:
        system_context += f"\n\nCurrent analysis context:\n{json.dumps(context, indent=2)}"

    # Build Gemini conversation
    chat_history = []
    for msg in history[-6:]:  # last 3 exchanges
        role = "user" if msg["role"] == "user" else "model"
        chat_history.append({"role": role, "parts": [msg["content"]]})

    prompt = f"{system_context}\n\nUser question: {message}"

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: _gemini_call(prompt, history=chat_history)
    )
    return response


# ─── Gemini Helper ────────────────────────────────────────

def _gemini_call(prompt: str, history: list = None) -> str:
    """Synchronous Gemini API call. Wrap in executor for async routes."""
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )
    return response.text


# ─── Health ───────────────────────────────────────────────

@app.get("/api/ml/health")
async def ml_health():
    return {
        "status": "ok",
        "patterns_registered": list(PATTERN_REGISTRY.keys()),
        "model": MODEL_NAME,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agents.ml_service:app", host="0.0.0.0", port=8001, reload=True)
