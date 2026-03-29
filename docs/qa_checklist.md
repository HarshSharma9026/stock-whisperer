
STOCK WHISPERER — QA TEST CHECKLIST
Owner: 'Useless' Guy
Run this before every demo and before final submission.
═══════════════════════════════════════════════════════

PHASE 1 TESTS (Foundation)
□ Search for RELIANCE → autocomplete shows company name + NSE
□ Search for invalid ticker (e.g. XYZXYZ) → shows error message, not crash
□ StockInfoCard loads: price, change%, 52W high/low, market cap, PE
□ Candlestick chart renders for 1D / 1W / 1M / 3M timeframes
□ Chart is interactive: can zoom, pan, hover for OHLCV values
□ Volume bars visible below price chart

PHASE 2 TESTS (Intelligence)
□ Pattern detected for at least 3 major NSE stocks (test: TCS, HDFC, INFY)
□ Confluence score displayed as number + label (Weak/Moderate/Strong)
□ Score breakdown shows all 6 components (pattern, volume, RSI, MACD, news, promoter)
□ Volume spike highlighted on chart when present
□ Backtest stats shown below pattern (success rate + avg return + duration)

PHASE 3 TESTS (AI Layer)
□ Narrative loads in <8 seconds from cold start
□ Narrative is 3-4 sentences, specific to the ticker (not generic)
□ Hindi toggle → narrative switches to Hindi (verify with native speaker)
□ Hinglish toggle → narrative switches to Hinglish mix
□ Cached result: same ticker/language served in <500ms second time
□ Chat Q&A: ask "What does this mean for short-term traders?" → relevant answer
□ Chat Q&A: ask a Hindi question → responds in Hindi if Hindi mode active
□ News sentiment shown: Positive/Neutral/Negative
□ Promoter activity shown: Buying/Selling/Pledging/No recent activity

PHASE 4 TESTS (Polish)
□ Watchlist: add 3 tickers, reload page, watchlist persists
□ Watchlist: clicking a watchlist item loads full analysis
□ Watchlist: attempting to add 11th ticker shows warning
□ SEBI disclaimer visible on every analysis output
□ SEBI disclaimer translates when language is toggled
□ Impact Model page loads with correct numbers

PERFORMANCE TESTS
□ /api/quote response time < 2 seconds (cold)
□ /api/chart response time < 2 seconds (cold)
□ /api/analysis full response < 8 seconds (cold)
□ Cached /api/analysis response < 500ms
□ App loads on 375px mobile width without horizontal scroll
□ First analysis visible without scrolling on 1080p screen

ERROR HANDLING TESTS
□ Disconnect internet → app shows graceful error card, not blank screen
□ Search with empty string → no request fired, no crash
□ Invalid API response → error boundary catches, shows user-friendly message

HACKATHON JUDGE DEMO FLOW (practice this sequence)
─────────────────────────────────────────────────
1. Open app → explain the problem (30 sec)
2. Search TATAMOTORS → quote card loads
3. Point to chart → explain timeframe controls (15 sec)
4. Pattern detected → explain confluence score breakdown (45 sec)
5. Read narrative aloud → toggle to Hindi → toggle to Hinglish (30 sec)
6. Ask one chat question live: "Is this a good setup for a 2-week trade?" (30 sec)
7. Show promoter activity + news sentiment (15 sec)
8. Add to watchlist (10 sec)
9. Pivot to impact model page → quote key numbers (45 sec)
TOTAL: ~3.5 min (trim to 3 min for submission video)
