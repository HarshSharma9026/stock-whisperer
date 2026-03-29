// ============================================================
// STOCK WHISPERER — Redesigned App
// ============================================================

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  TickerSearch, StockInfoCard, CandlestickChart,
  AnalysisCard, Watchlist, SEBIDisclaimer, useStockData
} from "./components/components_index";
import { ImpactModel } from "./components/ImpactModel";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 2 } },
});

function StockApp() {
  const [ticker, setTicker] = useState(null);
  const [timeframe, setTimeframe] = useState("1mo");
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("analysis"); // analysis | impact

  const { stockInfo, chartData, isLoading } = useStockData(ticker, timeframe);

  const timeframes = [
    { label: "1D", value: "1d" },
    { label: "1W", value: "5d" },
    { label: "1M", value: "1mo" },
    { label: "3M", value: "3mo" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top Nav */}
      <nav className="border-b border-white/5 bg-[#0d1220]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold">
              SW
            </div>
            <span className="font-semibold text-white tracking-tight">Stock Whisperer</span>
            <span className="hidden sm:block text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
              AI-Powered
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switcher */}
            <div className="hidden md:flex bg-white/5 rounded-lg p-0.5">
              {[{ id: "analysis", label: "Analysis" }, { id: "impact", label: "Impact Model" }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Language */}
            <div className="flex bg-white/5 rounded-lg p-0.5">
              {[{ v: "en", l: "EN" }, { v: "hi", l: "हिंदी" }, { v: "hinglish", l: "HG" }].map(({ v, l }) => (
                <button key={v} onClick={() => setLanguage(v)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    language === v ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-5">

        {activeTab === "analysis" ? (
          <div className="space-y-4">

            {/* Search + Watchlist Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <TickerSearch onSelect={(t) => { setTicker(t); setActiveTab("analysis"); }} selectedTicker={ticker} />
              </div>
              <Watchlist onSelect={setTicker} activeTicker={ticker} inline />
            </div>

            {ticker ? (
              <>
                {/* Stock Header + Chart — 2 column on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Left: Stock Info */}
                  <div className="lg:col-span-1">
                    <StockInfoCard data={stockInfo} isLoading={isLoading} />
                  </div>

                  {/* Right: Chart */}
                  <div className="lg:col-span-2 bg-[#0d1220] rounded-2xl border border-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">
                        {ticker} — Price Chart
                      </span>
                      <div className="flex gap-1">
                        {timeframes.map(({ label, value }) => (
                          <button key={value} onClick={() => setTimeframe(value)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                              timeframe === value
                                ? "bg-blue-600 text-white"
                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <CandlestickChart data={chartData} isLoading={isLoading} />
                  </div>
                </div>

                {/* AI Analysis */}
                <AnalysisCard ticker={ticker} language={language} />
              </>
            ) : (
              <EmptyState onSelect={setTicker} />
            )}
          </div>
        ) : (
          <ImpactModel />
        )}
      </main>

      <SEBIDisclaimer language={language} />
    </div>
  );
}

function EmptyState({ onSelect }) {
  const popular = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS"];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center text-3xl mb-5">
        📈
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Search any NSE / BSE stock</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        Get AI-powered chart pattern analysis, confluence scoring, and plain-English insights in seconds.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {popular.map(t => (
          <button key={t} onClick={() => onSelect(t)}
            className="px-3 py-1.5 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/40 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Import DM Sans font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <StockApp />
    </QueryClientProvider>
  );
}