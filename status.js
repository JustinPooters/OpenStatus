import { latestCheck, recentChecks, recentIncidents } from './db.js';

const DAY = 86_400_000;
const isoDaysAgo = days => new Date(Date.now() - days * DAY).toISOString();

export function buildStatus(config) {
  const monitors = config.monitors.filter(monitor => monitor.enabled !== false);
  const services = monitors.map(monitor => {
    const latest = latestCheck.get(monitor.id);
    const checks = recentChecks.all(monitor.id, isoDaysAgo(30));
    const days = [];
    for (let offset = (config.site.historyDays ?? 30) - 1; offset >= 0; offset--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - offset);
      const end = new Date(start.getTime() + DAY);
      const subset = checks.filter(c => c.checked_at >= start.toISOString() && c.checked_at < end.toISOString());
      const successful = subset.filter(c => c.ok).length;
      days.push({
        date: start.toISOString().slice(0, 10),
        state: subset.length === 0 ? 'unknown' : successful === subset.length ? 'up' : successful === 0 ? 'down' : 'partial',
        uptime: subset.length ? (successful / subset.length) * 100 : null,
        checks: subset.length
      });
    }
    const successful = checks.filter(c => c.ok).length;
    return {
      ...monitor,
      latest,
      state: !latest ? 'unknown' : latest.ok ? (latest.response_ms > (config.site.slowThresholdMs ?? 2500) ? 'slow' : 'up') : 'down',
      uptime: checks.length ? (successful / checks.length) * 100 : null,
      days
    };
  });
  const states = services.map(service => service.state);
  const overall = states.includes('down') ? 'down' : states.includes('slow') ? 'degraded' : states.every(x => x === 'unknown') ? 'unknown' : 'up';
  const categories = config.categories.map(category => ({ ...category, services: services.filter(service => service.category === category.id) })).filter(category => category.services.length);
  return { site: config.site, overall, categories, services, incidents: recentIncidents.all(isoDaysAgo(config.site.historyDays ?? 30)), generatedAt: new Date().toISOString() };
}

