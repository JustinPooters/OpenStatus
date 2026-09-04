import fs from 'node:fs';
import net from 'node:net';
import dns from 'node:dns/promises';
import { insertCheck, currentIncident, openIncident, updateIncident, resolveIncident, lastChecks } from './db.js';

export const config = JSON.parse(fs.readFileSync(new URL('./config/status.json', import.meta.url), 'utf8'));
export const monitors = config.monitors.filter(monitor => monitor.enabled !== false);
const ids = new Set();
for (const monitor of monitors) {
  if (!monitor.id || !monitor.name || !monitor.type) throw new Error('Elke actieve monitor heeft id, name en type nodig');
  if (ids.has(monitor.id)) throw new Error(`Dubbele monitor-id: ${monitor.id}`);
  if (!config.categories.some(category => category.id === monitor.category)) throw new Error(`Onbekende categorie voor ${monitor.id}: ${monitor.category}`);
  ids.add(monitor.id);
}
const DEFAULT_FORBIDDEN = [
  /502 bad gateway/i,
  /503 service unavailable/i,
  /504 gateway time-out/i,
  /no available upstream/i,
  /upstream connect error/i
];

async function checkHttp(monitor) {
  const response = await fetch(monitor.url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(monitor.timeoutMs ?? 10000),
    headers: { 'user-agent': 'OpenStatus/1.0' }
  });
  const body = (await response.text()).slice(0, 500_000);
  if (!(monitor.expectedStatuses ?? [200]).includes(response.status)) return { statusCode: response.status, reason: `Onverwachte HTTP-status ${response.status}` };
  if (monitor.requiredText && !body.toLowerCase().includes(monitor.requiredText.toLowerCase())) return { statusCode: response.status, reason: `Verwachte inhoud ontbreekt: ${monitor.requiredText}` };
  const patterns = [...DEFAULT_FORBIDDEN, ...(monitor.forbiddenText ?? []).map(x => new RegExp(x, 'i'))];
  if (patterns.some(pattern => pattern.test(body))) return { statusCode: response.status, reason: 'Foutpagina gedetecteerd ondanks succesvolle HTTP-status' };
  return { statusCode: response.status, reason: null };
}

function checkTcp(monitor) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: monitor.host, port: monitor.port });
    const done = reason => { socket.destroy(); resolve({ statusCode: null, reason }); };
    socket.setTimeout(monitor.timeoutMs ?? 5000);
    socket.once('connect', () => done(null));
    socket.once('timeout', () => done('TCP-verbinding verlopen (timeout)'));
    socket.once('error', error => done(`TCP niet bereikbaar: ${error.message}`));
  });
}

async function checkDns(monitor) {
  const resolver = new dns.Resolver();
  if (monitor.servers?.length) resolver.setServers(monitor.servers);
  const values = await Promise.race([
    resolver.resolve(monitor.hostname, monitor.recordType ?? 'A'),
    new Promise((_, reject) => setTimeout(() => reject(new Error('DNS check timed out')), monitor.timeoutMs ?? 5000))
  ]);
  const expected = monitor.expectedValues ?? [];
  const flattened = values.map(value => typeof value === 'string' ? value : JSON.stringify(value));
  if (expected.length && !expected.every(value => flattened.includes(value))) return { statusCode: null, reason: `DNS-waarde wijkt af: ${flattened.join(', ')}` };
  return { statusCode: null, reason: null };
}

export async function checkMonitor(monitor) {
  const started = performance.now();
  let statusCode = null;
  let reason = null;
  try {
    const result = monitor.type === 'tcp' ? await checkTcp(monitor) : monitor.type === 'dns' ? await checkDns(monitor) : await checkHttp(monitor);
    statusCode = result.statusCode;
    reason = result.reason;
  } catch (error) {
    reason = error.name === 'TimeoutError' ? 'Controle verlopen (timeout)' : `Niet bereikbaar: ${error.message}`;
  }

  const checkedAt = new Date().toISOString();
  const responseMs = Math.round(performance.now() - started);
  const ok = reason === null;
  insertCheck.run({ monitorId: monitor.id, checkedAt, ok: ok ? 1 : 0, statusCode, responseMs, reason });

  const active = currentIncident.get(monitor.id);
  const failures = lastChecks.all(monitor.id, config.site.failureThreshold ?? 2);
  const recoveries = lastChecks.all(monitor.id, config.site.recoveryThreshold ?? 2);
  const confirmedDown = failures.length >= (config.site.failureThreshold ?? 2) && failures.every(check => !check.ok);
  const confirmedUp = recoveries.length >= (config.site.recoveryThreshold ?? 2) && recoveries.every(check => check.ok);
  if (confirmedDown && !active) {
    openIncident.run(monitor.id, checkedAt, `Service disruption: ${monitor.name}`, 'Automatically detected outage', reason);
  } else if (!ok && active) {
    updateIncident.run(reason, active.id);
  } else if (confirmedUp && active) {
    resolveIncident.run(checkedAt, active.id);
  }
  return { monitorId: monitor.id, checkedAt, ok, statusCode, responseMs, reason };
}

export async function runChecks() {
  return Promise.allSettled(monitors.map(checkMonitor));
}
