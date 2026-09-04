import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, runChecks } from './monitor.js';
import { buildStatus } from './status.js';

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
app.set('view engine', 'ejs');
app.set('views', path.join(root, 'views'));
app.use(express.static(path.join(root, 'public'), { maxAge: '1h' }));

app.get('/', (_req, res) => res.render('index', { status: buildStatus(config) }));
app.get('/api/status', (_req, res) => res.json(buildStatus(config)));
app.get('/healthz', (_req, res) => res.json({ ok: true, checkedAt: new Date().toISOString() }));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0', async () => {
  console.log(`Status page listening on ${port}`);
  await runChecks();
  setInterval(runChecks, Number(process.env.CHECK_INTERVAL_MS ?? config.site.checkIntervalMs ?? 60_000)).unref();
});

