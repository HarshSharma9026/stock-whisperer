// ============================================================
// STOCK WHISPERER — Components (Redesigned)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API_BASE });

// ─── Tooltip helper ───────────────────────────────────────

function Tooltip({ text, children }) {
  return (
    <span className="tooltip-container inline-flex items-center gap-1">
      {children}
      <span className="w-3.5 h-3.5 rounded-full bg-white/[0.07] border border-white/15 text-[9px] text-gray-500 flex items-center justify-center font-bold hover:bg-blue-500/20 hover:border-blue-400/40 hover:text-blue-300 transition-all cursor-help shrink-0">
        i
      </span>
      <span className="tooltip-box">{text}</span>
    </span>
  );
}

// ─── Hooks ────────────────────────────────────────────────

export function useStockData(ticker, timeframe) {
  const quoteQuery = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.get(`/api/quote?ticker=${ticker}`).then(r => r.data),
    enabled: !!ticker,
  });
  const chartQuery = useQuery({
    queryKey: ["chart", ticker, timeframe],
    queryFn: () => api.get(`/api/chart?ticker=${ticker}&period=${timeframe}`).then(r => r.data),
    enabled: !!ticker,
  });
  return {
    stockInfo: quoteQuery.data,
    chartData: chartQuery.data,
    isLoading: quoteQuery.isLoading || chartQuery.isLoading,
    isError: quoteQuery.isError || chartQuery.isError,
  };
}

export function useAnalysis(ticker, language) {
  return useQuery({
    queryKey: ["analysis", ticker, language],
    queryFn: () => api.get(`/api/analysis?ticker=${ticker}&lang=${language}`).then(r => r.data),
    enabled: !!ticker,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── TickerSearch ─────────────────────────────────────────

export function TickerSearch({ onSelect, selectedTicker }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const searchQuery = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.get(`/api/search?q=${query}`).then(r => r.data),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    if (searchQuery.data) { setResults(searchQuery.data.results || []); setOpen(true); }
  }, [searchQuery.data]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center bg-[#0d1220] border border-white/[0.08] rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-all">
        <svg className="w-4 h-4 text-gray-600 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text"
          placeholder="Search NSE / BSE symbol… e.g. RELIANCE, TCS"
          className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
          value={query}
          onChange={e => setQuery(e.target.value.toUpperCase())}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {selectedTicker && (
          <span className="text-[11px] bg-blue-500/15 text-blue-300 border border-blue-500/25 px-2 py-0.5 rounded-lg font-mono ml-2">
            {selectedTicker}
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#0d1220] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
          {results.map((r, i) => (
            <button key={r.symbol}
              className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.04] transition-colors ${i < results.length - 1 ? "border-b border-white/[0.05]" : ""}`}
              onClick={() => { onSelect(r.symbol); setQuery(""); setOpen(false); }}>
              <div>
                <p className="text-white font-medium text-sm font-mono">{r.symbol}</p>
                <p className="text-gray-600 text-xs mt-0.5">{r.name}</p>
              </div>
              <span className="text-[10px] text-gray-600 bg-white/[0.04] px-2 py-1 rounded-lg font-mono">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StockInfoCard ────────────────────────────────────────

export function StockInfoCard({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-[#0d1220] rounded-2xl border border-white/[0.06] p-5 h-full animate-pulse">
        <div className="h-6 bg-white/[0.05] rounded w-32 mb-2" />
        <div className="h-4 bg-white/[0.05] rounded w-48 mb-6" />
        <div className="h-10 bg-white/[0.05] rounded w-40 mb-6" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-white/[0.05] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.change_pct >= 0;

  return (
    <div className="bg-[#0d1220] rounded-2xl border border-white/[0.06] p-5 h-full">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-bold text-white font-mono tracking-wider">{data.symbol}</h2>
          <p className="text-gray-600 text-xs mt-0.5">{data.name}</p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-lg border font-medium mt-0.5 ${
          isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                     : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {isPositive ? "▲" : "▼"} NSE
        </span>
      </div>

      <div className="mt-4 mb-5">
        <p className="text-4xl font-bold text-white tracking-tight">
          ₹{data.price?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={`text-sm font-medium mt-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          {isPositive ? "▲" : "▼"} {Math.abs(data.change_pct)?.toFixed(2)}% today
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "52W High", value: `₹${data.week_high_52?.toLocaleString("en-IN")}`, tip: "Highest price in the last 52 weeks" },
          { label: "52W Low", value: `₹${data.week_low_52?.toLocaleString("en-IN")}`, tip: "Lowest price in the last 52 weeks" },
          { label: "Mkt Cap", value: data.market_cap_cr ? `₹${Number(data.market_cap_cr).toLocaleString("en-IN")}Cr` : "—", tip: "Total market capitalisation in Indian Rupees Crore" },
          { label: "P/E Ratio", value: data.pe_ratio?.toFixed(1) || "—", tip: "Price-to-Earnings ratio — how much investors pay per ₹1 of earnings" },
          { label: "Volume", value: data.volume_fmt || "—", tip: "Number of shares traded today" },
          { label: "Avg Volume", value: data.avg_volume_fmt || "—", tip: "Average daily trading volume over the past 3 months" },
        ].map(({ label, value, tip }) => (
          <div key={label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5">
            <Tooltip text={tip}>
              <p className="text-gray-600 text-[10px] uppercase tracking-wider">{label}</p>
            </Tooltip>
            <p className="text-white text-sm font-medium font-mono mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CandlestickChart ─────────────────────────────────────

export function CandlestickChart({ data, isLoading }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (!data?.candles || data.candles.length === 0) return;

    import("lightweight-charts").then(({ createChart, CrosshairMode }) => {
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 320,
        layout: { background: { color: "transparent" }, textColor: "#6B7280" },
        grid: { vertLines: { color: "#ffffff06" }, horzLines: { color: "#ffffff06" } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: "#ffffff08" },
        timeScale: { borderColor: "#ffffff08", timeVisible: true, secondsVisible: false },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10B981", downColor: "#EF4444",
        borderVisible: false,
        wickUpColor: "#10B981", wickDownColor: "#EF4444",
      });

      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" }, priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

      const sorted = [...data.candles].sort((a, b) => a.time > b.time ? 1 : -1);
      candleSeries.setData(sorted.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
      volumeSeries.setData(sorted.map(c => ({ time: c.time, value: c.volume, color: c.close >= c.open ? "#10B98120" : "#EF444420" })));

      chart.timeScale().fitContent();
      chartRef.current = chart;

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current)
          chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    });

    return () => { if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-80 rounded-xl bg-white/[0.02] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-600 text-xs">Loading chart…</p>
        </div>
      </div>
    );
  }

  if (!data || !data.candles || data.candles.length === 0) {
    return (
      <div className="h-80 rounded-xl bg-white/[0.02] flex items-center justify-center">
        <p className="text-gray-600 text-sm">No chart data available</p>
      </div>
    );
  }

  return <div ref={chartContainerRef} className="w-full rounded-xl overflow-hidden" style={{ height: "320px" }} />;
}

// ─── AnalysisCard ─────────────────────────────────────────

export function AnalysisCard({ ticker, language }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const { data, isLoading } = useAnalysis(ticker, language);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const sendChat = async (msg) => {
    const message = msg || chatInput;
    if (!message.trim()) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: message }]);
    setChatLoading(true);
    try {
      const res = await api.post("/api/chat", { ticker, language, message, history: chatMessages, context: data ?? null });
      setChatMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, couldn't get a response. Try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[#0d1220] rounded-2xl border border-white/[0.06] p-5 animate-pulse space-y-3">
            <div className="h-5 bg-white/[0.05] rounded w-32" />
            <div className="h-28 bg-white/[0.05] rounded-xl" />
            <div className="h-16 bg-white/[0.05] rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const score = data.confluence_score || 0;
  const scoreColor = score >= 71 ? "#10B981" : score >= 41 ? "#F59E0B" : "#EF4444";
  const scoreBg = score >= 71 ? "from-emerald-500/10 border-emerald-500/20"
                : score >= 41 ? "from-amber-500/10 border-amber-500/20"
                : "from-red-500/10 border-red-500/20";
  const scoreLabel = score >= 71 ? "Strong Setup" : score >= 41 ? "Moderate Setup" : "Weak Setup";

  const signals = [
    { label: "Pattern", key: "pattern", max: 30, tip: "Based on pattern type, geometry quality and TA-Lib confidence score" },
    { label: "Volume", key: "volume", max: 15, tip: "Volume spike >1.5x 20-day average at the breakout point adds full 15 pts" },
    { label: "RSI", key: "rsi", max: 15, tip: "RSI <40 for bullish setups (oversold), RSI >60 for bearish setups (overbought)" },
    { label: "MACD", key: "macd", max: 15, tip: "MACD line crossing signal line in the direction of the detected pattern" },
    { label: "News", key: "news", max: 15, tip: "Gemini classifies last 5 headlines as Positive (15pts), Neutral (7pts), or Negative (0pts)" },
    { label: "Promoter", key: "promoter", max: 10, tip: "BSE bulk deal data: promoter buying adds +10, pledging subtracts -10" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── Left: Score + Pattern + Signals ── */}
      <div className="bg-[#0d1220] rounded-2xl border border-white/[0.06] p-5 space-y-5">

        {/* Confluence Score — BIG */}
        <div className={`bg-gradient-to-br ${scoreBg} border rounded-2xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <Tooltip text="A weighted 0–100 score combining 6 market signals. 71+ = Strong, 41–70 = Moderate, 0–40 = Weak.">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Confluence Score</p>
              </Tooltip>
              <div className="flex items-end gap-3 mt-1">
                <span className="text-6xl font-bold leading-none tracking-tight" style={{ color: scoreColor }}>
                  {score}
                </span>
                <div className="mb-1">
                  <span className="text-sm font-semibold" style={{ color: scoreColor }}>/100</span>
                  <p className="text-xs font-medium mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</p>
                </div>
              </div>
            </div>
            {/* Circular gauge */}
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="2.5"
                  strokeDasharray={`${score} 100`} strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold font-mono" style={{ color: scoreColor }}>{score}</span>
                <span className="text-[9px] text-gray-600">/ 100</span>
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${score}%`, background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})` }} />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-600">
              <span>0 — Weak</span><span>41 — Moderate</span><span>71 — Strong</span>
            </div>
          </div>
        </div>

        {/* Pattern — BIG */}
        {data.pattern ? (
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📐</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tooltip text="Chart patterns are formations in price data that historically precede certain price movements.">
                    <span className="text-white font-semibold text-sm">Pattern Detected</span>
                  </Tooltip>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-medium">
                    {data.pattern.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    data.pattern.direction === "bullish"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {data.pattern.direction === "bullish" ? "↑ Bullish" : "↓ Bearish"}
                  </span>
                </div>
                {data.pattern.description && (
                  <p className="text-gray-500 text-xs mt-1">{data.pattern.description}</p>
                )}
              </div>
            </div>

            {data.backtest && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Success Rate", value: `${data.backtest.success_rate}%`, tip: "% of times this pattern led to the expected price move on NSE stocks over 3 years", color: "text-emerald-400" },
                  { label: "Avg Gain", value: `+${data.backtest.avg_return}%`, tip: "Average price gain when the pattern successfully played out", color: "text-emerald-400" },
                  { label: "Avg Duration", value: `${data.backtest.avg_duration_days}d`, tip: "Average number of days for the full pattern move to complete", color: "text-blue-400" },
                ].map(({ label, value, tip, color }) => (
                  <div key={label} className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                    <Tooltip text={tip}>
                      <p className="text-gray-600 text-[9px] uppercase tracking-wider mb-1">{label}</p>
                    </Tooltip>
                    <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center">
            <p className="text-gray-600 text-sm">No clear pattern detected on this timeframe</p>
            <p className="text-gray-700 text-xs mt-1">Try switching to 3M view</p>
          </div>
        )}

        {/* Signal Breakdown */}
        <div>
          <Tooltip text="Each signal contributes a weighted score to the total Confluence Score">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Signal Breakdown</p>
          </Tooltip>
          <div className="space-y-2.5">
            {signals.map(({ label, key, max, tip }) => {
              const val = data.scores?.[key] ?? 0;
              const pct = (val / max) * 100;
              const barColor = pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";
              return (
                <div key={key} className="flex items-center gap-3">
                  <Tooltip text={tip}>
                    <span className="text-xs text-gray-500 w-16">{label}</span>
                  </Tooltip>
                  <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                  <span className="text-xs font-mono text-gray-500 w-10 text-right">{val}/{max}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment + Promoter */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <Tooltip text="Classified from the last 5 news headlines using Gemini AI. Feeds into the News signal score.">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">News Sentiment</p>
            </Tooltip>
            <p className={`text-sm font-semibold flex items-center gap-1.5 ${
              data.news_sentiment === "Positive" ? "text-emerald-400"
              : data.news_sentiment === "Negative" ? "text-red-400" : "text-amber-400"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {data.news_sentiment || "Neutral"}
            </p>
            {data.news_summary && <p className="text-gray-700 text-[10px] mt-1 line-clamp-2">{data.news_summary}</p>}
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <Tooltip text="Scraped from BSE bulk deal filings. Promoter buying = +10pts, pledging = -10pts to confluence score.">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Promoter Activity</p>
            </Tooltip>
            <p className={`text-sm font-semibold flex items-center gap-1.5 ${
              data.promoter_action === "Buying" ? "text-emerald-400"
              : data.promoter_action === "Selling" || data.promoter_action === "Pledging" ? "text-red-400"
              : "text-gray-500"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {data.promoter_action || "No Activity"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Narrative + Chat ── */}
      <div className="bg-[#0d1220] rounded-2xl border border-white/[0.06] p-5 flex flex-col gap-5">

        {/* Narrative — BIG */}
        <div>
          <Tooltip text="Generated by Gemini 2.5 Flash — synthesizes all 6 signals into a 3-4 sentence plain-English analysis">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">AI Narrative</p>
          </Tooltip>
          <div className="relative bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/10 rounded-2xl p-5">
            <div className="absolute top-3 right-3 text-lg opacity-20">🤖</div>
            <p className="text-gray-200 text-sm leading-relaxed">
              {data.narrative || "Generating analysis…"}
            </p>
          </div>
        </div>

        {/* Chat */}
        <div className="flex flex-col flex-1">
          <Tooltip text="Context-aware Q&A: the AI receives your full analysis before answering, not just a generic prompt">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Ask a Follow-up</p>
          </Tooltip>

          {/* Quick prompts */}
          {chatMessages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                "Good for a 2-week trade?",
                "What's the stop loss?",
                "What could invalidate this?",
              ].map(q => (
                <button key={q} onClick={() => sendChat(q)}
                  className="text-[10px] bg-white/[0.03] hover:bg-blue-500/10 border border-white/[0.06] hover:border-blue-500/20 text-gray-600 hover:text-blue-300 rounded-lg px-2.5 py-1.5 transition-all">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-52 mb-3 pr-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white/[0.05] text-gray-300 border border-white/[0.06] rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/[0.06] px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input — fixed send icon direction */}
          <div className="flex gap-2">
            <input type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="Ask anything about this stock…"
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/40 transition-colors"
            />
            <button onClick={() => sendChat()}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0">
              {/* Paper plane — pointing up-right, no rotation needed */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="22" y1="2" x2="11" y2="13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Watchlist ────────────────────────────────────────────

export function Watchlist({ onSelect, activeTicker, inline }) {
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sw_watchlist") || "[]"); }
    catch { return []; }
  });

  const save = (list) => { setWatchlist(list); localStorage.setItem("sw_watchlist", JSON.stringify(list)); };
  const add = (symbol) => { if (watchlist.length >= 10 || watchlist.includes(symbol)) return; save([...watchlist, symbol]); };
  const remove = (symbol) => save(watchlist.filter(s => s !== symbol));

  useEffect(() => { window.addToWatchlist = add; }, [watchlist]);

  if (inline) {
    if (watchlist.length === 0 && !activeTicker) return null;
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {watchlist.map(symbol => (
          <div key={symbol}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-mono cursor-pointer transition-all border ${
              activeTicker === symbol
                ? "bg-blue-600/20 border-blue-500/35 text-blue-300"
                : "bg-white/[0.03] border-white/[0.08] text-gray-500 hover:text-white hover:bg-white/[0.06]"
            }`}
            onClick={() => onSelect(symbol)}>
            {symbol}
            <button onClick={e => { e.stopPropagation(); remove(symbol); }}
              className="text-gray-700 hover:text-red-400 transition-colors">✕</button>
          </div>
        ))}
        {activeTicker && !watchlist.includes(activeTicker) && watchlist.length < 10 && (
          <button onClick={() => add(activeTicker)}
            className="px-2.5 py-2 rounded-xl text-xs border border-dashed border-white/[0.08] text-gray-700 hover:text-blue-400 hover:border-blue-500/25 transition-all font-mono">
            + {activeTicker}
          </button>
        )}
      </div>
    );
  }

  if (watchlist.length === 0) return null;
  return (
    <div className="bg-[#0d1220] rounded-2xl border border-white/[0.06] p-4">
      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Watchlist</p>
      <div className="flex flex-wrap gap-2">
        {watchlist.map(symbol => (
          <div key={symbol}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono cursor-pointer transition-all border ${
              activeTicker === symbol ? "bg-blue-600/20 border-blue-500/35 text-blue-300" : "bg-white/[0.04] border-white/[0.08] text-gray-500 hover:text-white"
            }`}
            onClick={() => onSelect(symbol)}>
            {symbol}
            <button onClick={e => { e.stopPropagation(); remove(symbol); }} className="text-gray-600 hover:text-red-400 ml-0.5">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SEBI Disclaimer ──────────────────────────────────────

const DISCLAIMER = {
  en: "⚠️ This tool provides educational analysis only. It is not SEBI-registered investment advice. Please consult a registered advisor before making investment decisions.",
  hi: "⚠️ यह टूल केवल शैक्षणिक विश्लेषण प्रदान करता है। यह SEBI-पंजीकृत निवेश सलाह नहीं है।",
  hinglish: "⚠️ Yeh tool sirf educational analysis deta hai. Yeh SEBI-registered investment advice nahi hai.",
};

export function SEBIDisclaimer({ language }) {
  return (
    <footer className="border-t border-white/[0.04] px-4 py-3 mt-auto">
      <p className="text-gray-700 text-[11px] text-center max-w-2xl mx-auto">
        {DISCLAIMER[language] || DISCLAIMER.en}
      </p>
    </footer>
  );
}