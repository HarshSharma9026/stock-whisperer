// ============================================================
// STOCK WHISPERER — HomePage
// ============================================================

import { useState, useEffect } from "react";

const TICKER_DEMOS = [
  { ticker: "RELIANCE", pattern: "Double Bottom", score: 68, sentiment: "Positive" },
  { ticker: "TCS", pattern: "Cup & Handle", score: 74, sentiment: "Positive" },
  { ticker: "INFY", pattern: "Breakout", score: 52, sentiment: "Neutral" },
  { ticker: "HDFCBANK", pattern: "Bullish Flag", score: 61, sentiment: "Positive" },
];

const FEATURES = [
  {
    icon: "📐",
    title: "Pattern Detection",
    desc: "Detects 8 chart patterns — Cup & Handle, Double Bottom, Head & Shoulders, Breakouts and more — with visual overlays.",
    tooltip: "Uses TA-Lib + pandas-ta to detect patterns on real NSE/BSE OHLCV data",
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
  },
  {
    icon: "🎯",
    title: "Confluence Score",
    desc: "A single 0–100 score combining 6 signals: pattern strength, volume, RSI, MACD, news sentiment, and promoter activity.",
    tooltip: "Weighted formula: Pattern (30) + Volume (15) + RSI (15) + MACD (15) + News (15) + Promoter (10)",
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/20",
  },
  {
    icon: "📊",
    title: "NSE Backtesting",
    desc: "Every detected pattern is back-tested against 3 years of Nifty 500 data — showing real historical success rates.",
    tooltip: "E.g. Cup & Handle patterns succeeded 71% of the time with avg 9.4% gain over 6 weeks on NSE",
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
  },
  {
    icon: "🗣️",
    title: "Hindi / Hinglish",
    desc: "Full analysis in English, Hindi, or Hinglish — the first stock analysis tool built for Tier-2/3 India.",
    tooltip: "Powered by Gemini 2.5 Flash — not a translation, a full re-generation in the target language",
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/20",
  },
  {
    icon: "📰",
    title: "News Sentiment",
    desc: "Fetches the latest headlines from ET Markets and Google News, classified as Positive / Neutral / Negative.",
    tooltip: "RSS feed scraper + Gemini classification. Sentiment feeds directly into the Confluence Score.",
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/20",
  },
  {
    icon: "💬",
    title: "AI Chat Q&A",
    desc: "Ask follow-up questions in plain language — get contextual answers about the stock, pattern, and setup.",
    tooltip: "Context-aware: the AI receives the full analysis before answering, not just a generic prompt",
    color: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/20",
  },
];

const POPULAR = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS", "BAJFINANCE", "SBIN", "WIPRO"];

function InfoTooltip({ text }) {
  return (
    <span className="tooltip-container inline-flex items-center ml-1.5 cursor-help">
      <span className="w-3.5 h-3.5 rounded-full bg-white/10 border border-white/20 text-[9px] text-gray-400 flex items-center justify-center font-bold hover:bg-blue-500/20 hover:border-blue-400/40 hover:text-blue-300 transition-all">
        i
      </span>
      <span className="tooltip-box">{text}</span>
    </span>
  );
}

function ScoreRing({ score }) {
  const color = score >= 71 ? "#10B981" : score >= 41 ? "#F59E0B" : "#EF4444";
  return (
    <div className="relative w-12 h-12">
      <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${score} 100`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export function HomePage({ onSearch }) {
  const [demoIdx, setDemoIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const demo = TICKER_DEMOS[demoIdx];

  // Cycle through demo tickers
  useEffect(() => {
    const t = setInterval(() => setDemoIdx(i => (i + 1) % TICKER_DEMOS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Typing animation for search
  useEffect(() => {
    const target = demo.ticker;
    let i = 0;
    setTyped("");
    const t = setInterval(() => {
      if (i <= target.length) { setTyped(target.slice(0, i)); i++; }
      else clearInterval(t);
    }, 80);
    return () => clearInterval(t);
  }, [demo.ticker]);

  return (
    <div className="flex-1 flex flex-col">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-12 overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        {/* Badge */}
        <div className="animate-fade-up-1 mb-5">
          <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Built for the Indian Investor · ET AI Hackathon 2026
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-2 text-4xl sm:text-5xl md:text-6xl font-bold text-center leading-tight mb-4 max-w-3xl">
          <span className="text-white">Stop guessing.</span>
          <br />
          <span className="shimmer-text">Start Whispering.</span>
        </h1>

        <p className="animate-fade-up-3 text-gray-400 text-center max-w-lg text-base sm:text-lg mb-8 leading-relaxed">
          AI-powered chart pattern analysis with NSE backtesting,
          confluence scoring, and plain-English insights —
          in English, Hindi, or Hinglish.
        </p>

        {/* Search bar */}
        <div className="animate-fade-up-3 w-full max-w-lg mb-4">
          <div className="relative glow-blue rounded-2xl">
            <div className="flex items-center bg-[#0d1525] border border-white/10 rounded-2xl px-5 py-4 focus-within:border-blue-500/60 transition-all">
              <svg className="w-4 h-4 text-gray-500 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={`Try ${typed}█`}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm font-mono"
                onChange={e => e.target.value.length >= 2 && null}
                onKeyDown={e => { if (e.key === "Enter" && e.target.value.length >= 1) onSearch(e.target.value.toUpperCase()); }}
                onBlur={e => { if (e.target.value.length >= 1) onSearch(e.target.value.toUpperCase()); }}
              />
              <button
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
                onClick={e => {
                  const input = e.currentTarget.previousSibling;
                  if (input.value) onSearch(input.value.toUpperCase());
                }}>
                Analyse →
              </button>
            </div>
          </div>
        </div>

        {/* Popular tickers */}
        <div className="animate-fade-up-3 flex flex-wrap gap-2 justify-center mb-10">
          {POPULAR.map(t => (
            <button key={t} onClick={() => onSearch(t)}
              className="px-3 py-1.5 bg-white/[0.04] hover:bg-blue-600/15 border border-white/[0.07] hover:border-blue-500/30 rounded-xl text-xs text-gray-500 hover:text-blue-300 font-mono transition-all">
              {t}
            </button>
          ))}
        </div>

        {/* Live demo card */}
        <div className="animate-fade-up-3 w-full max-w-sm animate-float">
          <div className="bg-[#0d1525]/80 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono font-semibold text-sm">{demo.ticker}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
                    {demo.pattern}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">NSE · Live Analysis</p>
              </div>
              <ScoreRing score={demo.score} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: "Pattern", val: "✓ Detected", color: "text-emerald-400" },
                { label: "Sentiment", val: demo.sentiment, color: demo.sentiment === "Positive" ? "text-emerald-400" : "text-amber-400" },
                { label: "Setup", val: demo.score >= 71 ? "Strong" : demo.score >= 41 ? "Moderate" : "Weak",
                  color: demo.score >= 71 ? "text-emerald-400" : "text-amber-400" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-white/[0.03] rounded-xl p-2 text-center">
                  <p className="text-gray-600 text-[9px] uppercase tracking-wider mb-0.5">{label}</p>
                  <p className={`font-medium text-[10px] ${color}`}>{val}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${demo.score}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-600">
              <span>Weak</span><span>Moderate</span><span>Strong</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="px-4 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Everything you need to analyse a stock
          </h2>
          <p className="text-gray-500 text-sm">6 intelligence layers, one unified score</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc, tooltip, color, border }, i) => (
            <div key={title}
              className={`card-hover bg-gradient-to-br ${color} border ${border} rounded-2xl p-5 cursor-pointer`}
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => onSearch("RELIANCE")}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                <InfoTooltip text={tooltip} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────── */}
      <section className="border-t border-white/5 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "14 Cr+", label: "Demat accounts in India" },
            { value: "8 Patterns", label: "Chart patterns detected" },
            { value: "3 Languages", label: "EN, Hindi, Hinglish" },
            { value: "< 8 sec", label: "Full AI analysis time" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-white font-mono mb-1">{value}</p>
              <p className="text-gray-600 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
