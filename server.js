import express from 'express';
import { getHistoricalRates } from 'dukascopy-node';

const app = express();
const PORT = process.env.PORT || 10000;
app.disable('x-powered-by');
app.use(express.static('public', { extensions: ['html'] }));

const allowed = Object.freeze({ EURJPY: 'eurjpy', EURUSD: 'eurusd' });
const cache = new Map();
const datePattern = /^\\d{4}-\\d{2}-\\d{2}$/;

app.get('/health', (_req, res) => res.json({ ok: true, service: 'SMART EDGE X historical-data service' }));

app.get('/api/history', async (req, res) => {
  const pair = String(req.query.pair || '').toUpperCase();
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  if (!Object.hasOwn(allowed, pair)) return res.status(400).send('Only EURJPY and EURUSD are enabled.');
  if (!datePattern.test(from) || !datePattern.test(to) || from >= to) return res.status(400).send('Use valid YYYY-MM-DD from/to dates; to is exclusive.');
  const days = (Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000;
  if (!Number.isFinite(days) || days < 1 || days > 14) return res.status(400).send('Download requests are limited to 14 days per batch. The dashboard combines batches automatically.');
  const key = `${pair}:${from}:${to}:m1:bid`;
  if (cache.has(key)) return res.json(cache.get(key));
  console.log(`[history] start ${pair} ${from} -> ${to} (${days} days)`);
  try {
    const candles = await getHistoricalRates({
      instrument: allowed[pair],
      dates: { from, to },
      timeframe: 'm1',
      priceType: 'bid',
      format: 'json',
      volumes: false,
      useCache: true,
      batchSize: 5,
      pauseBetweenBatchesMs: 500,
      requestIntervalMs: 100,
      rateLimitRetryCount: 3,
      retryCount: 3,
      pauseBetweenRetriesMs: 1500,
      retryOnEmpty: true,
      failAfterRetryCount: true
    });
    if (!Array.isArray(candles) || candles.length === 0) {
      console.warn(`[history] empty result ${pair} ${from} -> ${to}`);
      return res.status(502).send('The historical provider returned no candles for this batch.');
    }
    const payload = { pair, from, to, timeframe: 'm1', priceType: 'bid', provider: 'Dukascopy public historical feed via dukascopy-node', count: candles.length, candles };
    cache.set(key, payload);
    console.log(`[history] complete ${pair} ${from} -> ${to}: ${candles.length} candles`);
    return res.json(payload);
  } catch (err) {
    console.error(`[history] failed ${pair} ${from} -> ${to}:`, err?.stack || err);
    return res.status(502).send('Historical provider request failed for this 14-day batch. Retry the download; completed batches can be fetched again from cache.');
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`SMART EDGE X listening on port ${PORT}`));
