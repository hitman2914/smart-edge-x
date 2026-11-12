import express from 'express';
import { getHistoricalRates } from 'dukascopy-node';

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.use(express.static('public', { extensions: ['html'] }));

const allowed = Object.freeze({ EURJPY: 'eurjpy', EURUSD: 'eurusd' });
const cache = new Map();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

app.get('/health', (_req, res) => res.json({ ok: true, service: 'SMART EDGE X historical-data service' }));

app.get('/api/history', async (req, res) => {
  const pair = String(req.query.pair || '').toUpperCase();
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  if (!Object.hasOwn(allowed, pair)) return res.status(400).send('Only EURJPY and EURUSD are enabled.');
  if (!datePattern.test(from) || !datePattern.test(to) || from >= to) return res.status(400).send('Use valid YYYY-MM-DD from/to dates; to is exclusive.');
  const days = (Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000;
  if (!Number.isFinite(days) || days < 1 || days > 366) return res.status(400).send('Date range must be between 1 and 366 days.');
  const key = `${pair}:${from}:${to}:m1:bid`;
  if (cache.has(key)) return res.json(cache.get(key));
  try {
    const candles = await getHistoricalRates({
      instrument: allowed[pair],
      dates: { from, to },
      timeframe: 'm1',
      priceType: 'bid',
      format: 'json',
      volumes: false,
      useCache: true,
      requestIntervalMs: 100,
      rateLimitRetryCount: 3
    });
    if (!Array.isArray(candles) || candles.length === 0) return res.status(502).send('No candles returned by the historical data provider.');
    const payload = { pair, from, to, timeframe: 'm1', priceType: 'bid', provider: 'Dukascopy public historical feed via dukascopy-node', count: candles.length, candles };
    cache.set(key, payload);
    return res.json(payload);
  } catch (err) {
    console.error('Historical data error:', err?.message || err);
    return res.status(502).send('Historical data provider request failed. Please retry later or use CSV import.');
  }
});

app.listen(PORT, () => console.log(`SMART EDGE X listening on ${PORT}`));
