# 📡 OpenStatus

[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-111111?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-history-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](./Dockerfile)
[![CapRover](https://img.shields.io/badge/CapRover-ready-00B8D9)](./captain-definition)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff3b3b.svg)](./LICENSE)

A small, self-hosted status page for monitoring websites, ports and DNS records. Built with Node.js, Express, EJS, SQLite and Tailwind CSS v4.

It checks more than the HTTP status code. OpenStatus can recognize error pages that incorrectly return `200 OK`—including friendly proxy error pages that hide a broken upstream service.

## ✨ Features

- 🌐 **HTTP(S) monitoring** — status codes, redirects, response time and reachability
- 🔎 **Content validation** — require expected text and reject known error-page content
- 🔌 **TCP monitoring** — check a domain or IP address on a configurable port
- 🧭 **DNS monitoring** — validate A, AAAA, MX, TXT and other DNS records
- 📊 **Thirty-day overview** — daily uptime blocks with configurable history length
- 🚨 **Automatic incidents** — opens after repeated failures and closes after recovery
- 🗂️ **Categories** — group components entirely from JSON
- 💾 **Persistent history** — lightweight SQLite storage
- 🐳 **Container ready** — Docker and CapRover configuration included
- 🤖 **Machine readable** — public status data via `/api/status`

## 🧱 Stack

| Part | Technology |
| --- | --- |
| Runtime | Node.js 22 |
| Web server | Express 5 |
| Templates | EJS |
| Interface | Tailwind CSS v4 browser CDN + custom CSS |
| Storage | SQLite via better-sqlite3 |
| Deployment | Docker / CapRover |

## 🚀 Quick start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

| Endpoint | Purpose |
| --- | --- |
| `/` | Public status page |
| `/api/status` | Complete status response as JSON |
| `/healthz` | Lightweight container health check |

## ⚙️ Configuration

All settings, categories and monitors live in [`config/status.json`](./config/status.json). A complete reusable example is available in [`config/status.example.json`](./config/status.example.json).

The included example monitors:

- `jxhq.net` using HTTP and required page content
- `google.com` as an external reference check
- `one.one.one.one` with expected Cloudflare DNS addresses (`1.1.1.1` and `1.0.0.1`)
- Disabled templates for custom TCP and DNS checks

### 🌐 HTTP monitor

```json
{
  "id": "website",
  "category": "websites",
  "type": "http",
  "name": "My website",
  "url": "https://example.com",
  "expectedStatuses": [200],
  "requiredText": "Welcome",
  "forbiddenText": ["502 Bad Gateway", "upstream unavailable"],
  "timeoutMs": 10000
}
```

### 🔌 TCP monitor

```json
{
  "id": "server-ssh",
  "category": "infrastructure",
  "type": "tcp",
  "name": "SSH",
  "host": "192.0.2.10",
  "port": 22,
  "timeoutMs": 5000
}
```

### 🧭 DNS monitor

```json
{
  "id": "cloudflare-dns",
  "category": "infrastructure",
  "type": "dns",
  "name": "Cloudflare DNS",
  "hostname": "one.one.one.one",
  "recordType": "A",
  "expectedValues": ["1.1.1.1", "1.0.0.1"],
  "timeoutMs": 5000
}
```

### 🗂️ Categories

```json
{
  "categories": [
    { "id": "websites", "name": "Websites", "description": "Public websites and applications" },
    { "id": "infrastructure", "name": "Infrastructure", "description": "Network services and endpoints" }
  ]
}
```

Every active monitor needs a unique `id` and a `category` that exists in the category list. Set `"enabled": false` to keep a monitor in the file without running it.

## 🛡️ Avoiding false alarms

OpenStatus supports configurable failure and recovery thresholds. A single network hiccup does not need to become a public incident.

```json
{
  "failureThreshold": 2,
  "recoveryThreshold": 2,
  "slowThresholdMs": 2500
}
```

An incident opens after two consecutive failures and closes after two consecutive successful checks.

## 🐳 CapRover deployment

1. Create a new CapRover app.
2. Attach persistent storage to `/app/data`.
3. Deploy this repository.
4. Optionally use `/healthz` as the container health endpoint.

The included [`captain-definition`](./captain-definition) points CapRover to the provided Dockerfile.

## 🗺️ Roadmap

- [ ] TLS certificate expiry monitoring
- [ ] Scheduled maintenance windows
- [ ] Manual incident updates
- [ ] Email, Discord and generic webhook notifications
- [ ] Password-protected administration
- [ ] Independent checks from multiple locations

## 🤝 Contributing

Issues and pull requests are welcome. Please keep changes focused, document new configuration fields and avoid committing generated SQLite databases.

## 📄 License

OpenStatus is available under the [MIT License](./LICENSE).

<sub>Still curious. Still monitoring. Built with scheduled requests and a reasonable amount of coffee.</sub>

