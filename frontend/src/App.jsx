// ============================================================
// STOCK WHISPERER — Frontend Starter
// Owner: Frontend Dev
// Phase 1 responsibilities: Scaffold, chart UI, ticker search
// ============================================================

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TickerSearch, StockInfoCard, CandlestickChart, AnalysisCard, Watchlist, SEBIDisclaimer, useStockData } from "./components/index";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

function StockApp() {
  const [ticker, setTicker] = useState(null);
  const [timeframe, setTimeframe] = useState("1mo");
  const [language, setLanguage] = useState("en"); // en | hi | hinglish

  const { stockInfo, chartData, isLoading, isError } = useStockData(ticker, timeframe);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <h1 className="text-xl font-bold text-white">Stock Whisperer</h1>
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
            AI-Powered
          </span>
        </div>

        {/* Language Toggle */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {["en", "hi", "hinglish"].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                language === lang
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {lang === "en" ? "EN" : lang === "hi" ? "हिंदी" : "Hinglish"}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <TickerSearch onSelect={setTicker} selectedTicker={ticker} />

        {ticker && (
          <>
            {/* Stock Info */}
            <StockInfoCard data={stockInfo} isLoading={isLoading} />

            {/* Chart */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
              {/* Timeframe Controls */}
              <div className="flex gap-2 mb-4">
                {[
                  { label: "1D", value: "1d" },
                  { label: "1W", value: "5d" },
                  { label: "1M", value: "1mo" },
                  { label: "3M", value: "3mo" },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setTimeframe(value)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      timeframe === value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <CandlestickChart data={chartData} isLoading={isLoading} />
            </div>

            {/* AI Analysis Card — Phase 3 */}
            <AnalysisCard ticker={ticker} language={language} />
          </>
        )}

        {/* Watchlist — Phase 4 */}
        <Watchlist onSelect={setTicker} activeTicker={ticker} />
      </main>

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
