// ============================================================
// STOCK WHISPERER — App with Homepage + Analysis
// ============================================================

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  TickerSearch, StockInfoCard, CandlestickChart,
  AnalysisCard, Watchlist, SEBIDisclaimer, useStockData
} from "./components/index";
import { ImpactModel } from "./components/ImpactModel";
import { HomePage } from "./components/HomePage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 2 } },
});

function StockApp() {
  const [ticker, setTicker] = useState(null);
  const [timeframe, setTimeframe] = useState("1mo");
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("analysis");
  const [page, setPage] = useState("home"); // home | app

  const { stockInfo, chartData, isLoading } = useStockData(ticker, timeframe);

  const handleTickerSelect = (t) => {
    setTicker(t);
    setPage("app");
    setActiveTab("analysis");
  };

  const timeframes = [
    { label: "1D", value: "1d" },
    { label: "1W", value: "5d" },
    { label: "1M", value: "1mo" },
    { label: "3M", value: "3mo" },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.15); }
          50% { box-shadow: 0 0 40px rgba(59,130,246,0.35); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-fade-up { animation: fadeUp 0.5s ease forwards; }
        .animate-fade-up-1 { animation: fadeUp 0.5s ease 0.1s both; }
        .animate-fade-up-2 { animation: fadeUp 0.5s ease 0.2s both; }
        .animate-fade-up-3 { animation: fadeUp 0.5s ease 0.3s both; }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .glow-blue { animation: pulse-glow 3s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .card-hover {
          transition: all 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          border-color: rgba(59,130,246,0.3);
        }
        .tooltip-container { position: relative; }
        .tooltip-box {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #1a2035;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 11px;
          color: #9ca3af;
          white-space: normal;
          width: 220px;
          text-align: center;
          line-height: 1.4;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease;
          z-index: 9999;
        }
        .tooltip-container:hover .tooltip-box { opacity: 1; }
        .tooltip-box::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(255,255,255,0.1);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* ── Nav ───────────────────────────────────────── */}
      <nav className="border-b border-white/5 bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => setPage("home")} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              SW
            </div>
            <span className="font-semibold text-white tracking-tight">Stock Whisperer</span>
            <span className="hidden sm:block text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/25 px-2 py-0.5 rounded-full">
              AI-Powered
            </span>
          </button>

          <div className="flex items-center gap-2">
              <div className="hidden md:flex bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
                {[{ id: "analysis", label: "Analysis" }, { id: "impact", label: "Impact" }].map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (page !== "app") setPage("app"); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeTab === tab.id && page === "app" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-white"
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              
            <div className="flex bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
              {[{ v: "en", l: "EN" }, { v: "hi", l: "हिं" }, { v: "hinglish", l: "HG" }].map(({ v, l }) => (
                <button key={v} onClick={() => setLanguage(v)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    language === v ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Pages ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {page === "home" ? (
          <HomePage onSearch={handleTickerSelect} />
        ) : (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5">
            {activeTab === "analysis" ? (
              <div className="space-y-4 animate-fade-in">
                {/* Search + Watchlist */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <TickerSearch onSelect={handleTickerSelect} selectedTicker={ticker} />
                  </div>
                  <Watchlist onSelect={handleTickerSelect} activeTicker={ticker} inline />
                </div>

                {ticker && (
                  <>
                    {/* Stock info + Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up-1">
                      <div className="lg:col-span-1">
                        <StockInfoCard data={stockInfo} isLoading={isLoading} />
                      </div>
                      <div className="lg:col-span-2 bg-[#0d1220] rounded-2xl border border-white/[0.06] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-400 font-mono">{ticker}</span>
                          <div className="flex gap-1">
                            {timeframes.map(({ label, value }) => (
                              <button key={value} onClick={() => setTimeframe(value)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                  timeframe === value ? "bg-blue-600 text-white" : "bg-white/[0.04] text-gray-500 hover:text-white hover:bg-white/[0.08]"
                                }`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <CandlestickChart data={chartData} isLoading={isLoading} />
                      </div>
                    </div>

                    {/* Analysis */}
                    <div className="animate-fade-up-2">
                      <AnalysisCard ticker={ticker} language={language} />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                <ImpactModel />
              </div>
            )}
          </main>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <SEBIDisclaimer language={language} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StockApp />
    </QueryClientProvider>
  );
}