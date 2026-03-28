// ============================================================
// STOCK WHISPERER — Frontend Components & Hooks
// Owner: Frontend Dev
// File: All components in one file for quick reference
//       Split into /components/*.jsx during development
// ============================================================

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API_BASE });

// ─── Custom Hooks ──────────────────────────────────────────

export function useStockData(ticker, timeframe) {
  const quoteQuery = useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.get(`/api/quote?ticker=${ticker}`).then((r) => r.data),
    enabled: !!ticker,
  });

  const chartQuery = useQuery({
    queryKey: ["chart", ticker, timeframe],
    queryFn: () =>
      api.get(`/api/chart?ticker=${ticker}&period=${timeframe}`).then((r) => r.data),
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
    queryFn: () =>
      api.get(`/api/analysis?ticker=${ticker}&lang=${language}`).then((r) => r.data),
    enabled: !!ticker,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

// ─── TickerSearch ──────────────────────────────────────────

export function TickerSearch({ onSelect, selectedTicker }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  const searchQuery = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.get(`/api/search?q=${query}`).then((r) => r.data),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    if (searchQuery.data) {
      setResults(searchQuery.data.results || []);
      setOpen(true);
    }
  }, [searchQuery.data]);

  return (
    <div className="relative max-w-xl mx-auto">
      <div className="flex items-center bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
        <span className="text-gray-400 mr-3">🔍</span>
        <input
          type="text"
          placeholder="Search NSE / BSE symbol… e.g. RELIANCE, INFY"
          className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {selectedTicker && (
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md">
            {selectedTicker}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.symbol}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 transition-colors"
              onClick={() => {
                onSelect(r.symbol);
                setQuery("");
                setOpen(false);
              }}
            >
              <div>
                <p className="text-white font-medium text-sm">{r.symbol}</p>
                <p className="text-gray-400 text-xs">{r.name}</p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                {r.exchange}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StockInfoCard ─────────────────────────────────────────

export function StockInfoCard({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.change_pct >= 0;

  const stats = [
    { label: "Current Price", value: `₹${data.price?.toFixed(2)}` },
    { label: "Day Change", value: `${isPositive ? "+" : ""}${data.change_pct?.toFixed(2)}%`, highlight: true },
    { label: "52W High", value: `₹${data.week_high_52?.toFixed(0)}` },
    { label: "52W Low", value: `₹${data.week_low_52?.toFixed(0)}` },
    { label: "Market Cap", value: data.market_cap_cr ? `₹${data.market_cap_cr}Cr` : "—" },
    { label: "P/E Ratio", value: data.pe_ratio?.toFixed(1) || "—" },
    { label: "Volume", value: data.volume_fmt || "—" },
    { label: "Avg Volume", value: data.avg_volume_fmt || "—" },
  ];

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{data.symbol}</h2>
          <p className="text-gray-400 text-sm">{data.name}</p>
        </div>
        <div className={`text-right ${isPositive ? "text-green-400" : "text-red-400"}`}>
          <p className="text-3xl font-bold">₹{data.price?.toFixed(2)}</p>
          <p className="text-sm font-medium">
            {isPositive ? "▲" : "▼"} {Math.abs(data.change_pct)?.toFixed(2)}% today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.slice(2).map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className="text-white font-semibold text-sm">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CandlestickChart ──────────────────────────────────────
// NOTE: Use TradingView Lightweight Charts library for production
// Below is a clean Recharts placeholder — swap with:
//   import { createChart } from 'lightweight-charts'

export function CandlestickChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="h-80 bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading chart…</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 bg-gray-800 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  // TODO: Plug in TradingView Lightweight Charts here
  // Recommended implementation:
  //   const chartContainerRef = useRef();
  //   useEffect(() => {
  //     const chart = createChart(chartContainerRef.current, { ... });
  //     const candleSeries = chart.addCandlestickSeries();
  //     candleSeries.setData(data);
  //     return () => chart.remove();
  //   }, [data]);
  //   return <div ref={chartContainerRef} className="h-80" />;

  return (
    <div className="h-80 bg-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-700">
      <div className="text-center">
        <p className="text-gray-400 text-sm">📊 Chart renders here</p>
        <p className="text-gray-600 text-xs mt-1">
          Integrate TradingView Lightweight Charts
        </p>
        <p className="text-green-400 text-xs mt-1">{data.length} data points loaded ✓</p>
      </div>
    </div>
  );
}

// ─── AnalysisCard ──────────────────────────────────────────

export function AnalysisCard({ ticker, language }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const { data, isLoading } = useAnalysis(ticker, language);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await api.post("/api/chat", {
        ticker,
        language,
        message: userMsg,
        history: chatMessages,
      });
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't fetch a response. Try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 animate-pulse space-y-3">
        <div className="h-5 bg-gray-800 rounded w-40" />
        <div className="h-20 bg-gray-800 rounded" />
        <div className="h-16 bg-gray-800 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const scoreColor =
    data.confluence_score >= 71
      ? "text-green-400"
      : data.confluence_score >= 41
      ? "text-yellow-400"
      : "text-red-400";

  const scoreLabel =
    data.confluence_score >= 71
      ? "Strong Setup"
      : data.confluence_score >= 41
      ? "Moderate Setup"
      : "Weak Setup";

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🤖 AI Analysis
        </h3>
        <div className="text-right">
          <span className={`text-3xl font-bold ${scoreColor}`}>
            {data.confluence_score}
          </span>
          <p className={`text-xs font-medium ${scoreColor}`}>{scoreLabel}</p>
        </div>
      </div>

      {/* Pattern Detected */}
      {data.pattern && (
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 font-medium text-sm">
              📐 Pattern Detected
            </span>
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
              {data.pattern.type}
            </span>
          </div>
          {data.backtest && (
            <p className="text-gray-300 text-sm">
              Historical success rate on NSE:{" "}
              <span className="text-green-400 font-semibold">
                {data.backtest.success_rate}%
              </span>{" "}
              • Avg gain:{" "}
              <span className="text-green-400 font-semibold">
                {data.backtest.avg_return}%
              </span>{" "}
              over {data.backtest.avg_duration_days} days
            </p>
          )}
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          { label: "Pattern", score: data.scores?.pattern, max: 30 },
          { label: "Volume", score: data.scores?.volume, max: 15 },
          { label: "RSI", score: data.scores?.rsi, max: 15 },
          { label: "MACD", score: data.scores?.macd, max: 15 },
          { label: "News", score: data.scores?.news, max: 15 },
          { label: "Promoter", score: data.scores?.promoter, max: 10 },
        ].map(({ label, score, max }) => (
          <div key={label} className="bg-gray-800 rounded-lg p-2">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">{label}</span>
              <span className="text-white font-medium">
                {score ?? "—"}/{max}
              </span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full">
              <div
                className="h-1 bg-blue-500 rounded-full transition-all"
                style={{ width: score != null ? `${(score / max) * 100}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Narrative */}
      {data.narrative && (
        <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
          <p className="text-blue-100 text-sm leading-relaxed">{data.narrative}</p>
        </div>
      )}

      {/* Sentiment + Promoter */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">📰 News Sentiment</p>
          <p className={`font-medium ${
            data.news_sentiment === "Positive"
              ? "text-green-400"
              : data.news_sentiment === "Negative"
              ? "text-red-400"
              : "text-yellow-400"
          }`}>
            {data.news_sentiment || "—"}
          </p>
          {data.news_summary && (
            <p className="text-gray-500 text-xs mt-1">{data.news_summary}</p>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">🏢 Promoter Activity</p>
          <p className={`font-medium ${
            data.promoter_action === "Buying"
              ? "text-green-400"
              : data.promoter_action === "Selling" || data.promoter_action === "Pledging"
              ? "text-red-400"
              : "text-gray-400"
          }`}>
            {data.promoter_action || "—"}
          </p>
        </div>
      </div>

      {/* Chat Q&A */}
      <div className="border-t border-gray-800 pt-4">
        <p className="text-gray-400 text-xs mb-3">💬 Ask a follow-up question</p>

        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-3 py-2 rounded-xl text-sm text-gray-400 animate-pulse">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="e.g. Is this good for short-term trading?"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
          />
          <button
            onClick={sendChat}
            disabled={chatLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Watchlist ─────────────────────────────────────────────

export function Watchlist({ onSelect, activeTicker }) {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sw_watchlist") || "[]");
    } catch {
      return [];
    }
  });

  const save = (list) => {
    setWatchlist(list);
    localStorage.setItem("sw_watchlist", JSON.stringify(list));
  };

  const add = (symbol) => {
    if (watchlist.length >= 10 || watchlist.includes(symbol)) return;
    save([...watchlist, symbol]);
  };

  const remove = (symbol) => save(watchlist.filter((s) => s !== symbol));

  // Expose add to parent via a global (quick hack for hackathon)
  useEffect(() => {
    window.addToWatchlist = add;
  }, [watchlist]);

  if (watchlist.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <h3 className="text-white font-semibold mb-3">⭐ Watchlist</h3>
      <div className="flex flex-wrap gap-2">
        {watchlist.map((symbol) => (
          <div
            key={symbol}
            className={`flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors border ${
              activeTicker === symbol ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => onSelect(symbol)}
          >
            <span className="text-white text-sm font-medium">{symbol}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                remove(symbol);
              }}
              className="text-gray-500 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {activeTicker && !watchlist.includes(activeTicker) && watchlist.length < 10 && (
        <button
          onClick={() => add(activeTicker)}
          className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          + Add {activeTicker} to Watchlist
        </button>
      )}
    </div>
  );
}

// ─── SEBIDisclaimer ────────────────────────────────────────

const DISCLAIMER = {
  en: "⚠️ This tool provides educational analysis only. It is not SEBI-registered investment advice. Please consult a registered advisor before making investment decisions.",
  hi: "⚠️ यह टूल केवल शैक्षणिक विश्लेषण प्रदान करता है। यह SEBI-पंजीकृत निवेश सलाह नहीं है। निवेश निर्णय लेने से पहले कृपया एक पंजीकृत सलाहकार से परामर्श करें।",
  hinglish: "⚠️ Yeh tool sirf educational analysis deta hai. Yeh SEBI-registered investment advice nahi hai. Investment decisions lene se pehle ek registered advisor se milein.",
};

export function SEBIDisclaimer({ language }) {
  return (
    <footer className="mt-8 border-t border-gray-800 px-6 py-4">
      <p className="text-gray-500 text-xs text-center max-w-2xl mx-auto">
        {DISCLAIMER[language] || DISCLAIMER.en}
      </p>
    </footer>
  );
}
