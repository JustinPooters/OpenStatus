# OpenStatus

Een kleine, self-hosted statuspagina voor HTTP(S), TCP en DNS-monitoring. Gebouwd met Node.js, Express, EJS, SQLite en Tailwind CSS v4 via de browser-CDN.

## Wat wordt gecontroleerd?

- **HTTP(S):** statuscode, bereikbaarheid, responstijd, verplichte tekst en bekende foutpagina's die ten onrechte HTTP 200 teruggeven.
- **TCP:** bereikbaarheid van een domein of IP-adres op een specifieke poort.
- **DNS:** resolutie van A, AAAA, MX, TXT en andere records, optioneel tegen verwachte waarden.
- Automatische incidenten wanneer een monitor uitvalt, inclusief hersteltijd.
- Uptime-overzicht per dag over een configureerbare periode.

## Configuratie

Alles staat in `config/status.json`. `config/status.example.json` bevat een complete voorbeeldconfiguratie met `jxhq.net`, `google.com`, Cloudflare DNS (`one.one.one.one`), TCP en DNS. Voeg categorieen toe en koppel monitors met het veld `category`. Zet een monitor op `"enabled": false` om hem als voorbeeld te bewaren zonder controles uit te voeren.

Ook de meetfrequentie, historieperiode, grens voor trage reacties en het aantal mislukte of geslaagde controles voordat een incident opent of sluit zijn configureerbaar. Hierdoor veroorzaakt een enkele netwerkflits niet direct een openbaar incident.

### HTTP-monitor

```json
{
  "id": "website",
  "category": "websites",
  "type": "http",
  "name": "Mijn website",
  "url": "https://example.com",
  "expectedStatuses": [200],
  "requiredText": "Welkom",
  "forbiddenText": ["502 Bad Gateway"],
  "timeoutMs": 10000
}
```

### TCP-monitor

```json
{ "id": "server-ssh", "category": "infra", "type": "tcp", "name": "SSH", "host": "192.0.2.10", "port": 22 }
```

### DNS-monitor

```json
{ "id": "dns-a", "category": "dns", "type": "dns", "name": "Website DNS", "hostname": "example.com", "recordType": "A", "expectedValues": ["192.0.2.10"] }
```

## Lokaal starten

```bash
npm install
npm start
```

Open `http://localhost:3000`. De JSON-status is beschikbaar via `/api/status`; CapRover kan `/healthz` als healthcheck gebruiken.

## CapRover

Maak een app, koppel permanente opslag aan `/app/data` en deploy deze repository. De meegeleverde `captain-definition` en Dockerfile regelen de rest.

## Volgende logische uitbreidingen

- Beveiligde beheeromgeving
- Handmatige incidenten en gepland onderhoud
- E-mail, Discord of webhook-notificaties
- SSL-certificaatcontrole
- Meerdere locaties voor onafhankelijke controles

