SMART EDGE X v0.3 — hosted historical-data build

WHAT THIS VERSION ADDS
- Android-friendly web dashboard served by a Node.js backend
- Automatic M1 historical candle downloads for EURJPY and EURUSD only
- Date range selector (maximum 366 days per request)
- Uses Dukascopy public historical data through the open-source dukascopy-node package
- Existing local CSV import and in-browser backtesting remain available
- No broker connection or order execution

DEPLOYMENT
This package is ready for a Node.js host such as Render, but it is NOT already hosted.
1. Upload the contents of this folder to a GitHub repository you control.
2. In Render, create a new Blueprint and select that repository.
3. Render reads render.yaml, installs dependencies, and starts the app.
4. Open the HTTPS URL Render gives you. The page and /api/history endpoint are same-origin.
5. On the dashboard, select dates and tap Download EUR/JPY M1 and Download EUR/USD M1.
6. Run both backtests.

DEFAULT RANGE
2025-01-01 through 2026-01-01 (end date is exclusive).

NOTES
- Historical downloads can take time. Free hosting may sleep and may have memory/time limits.
- Dukascopy data is third-party market data and may not match a binary platform's expiry/settlement quote.
- Backtest outcomes are candle-based approximations. This is not proof of a tradable edge.
- Evidence score is not a win probability.
- Do not use real money based on these results.
- This app is for research and paper testing only.
