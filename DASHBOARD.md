# Live Performance Dashboard

## 🚀 Übersicht

Das AI DeepSeek Trader System verfügt über ein **Live-Dashboard** mit Echtzeit-Updates, das die Trading-Performance kontinuierlich visualisiert. Das Dashboard läuft auf einem lokalen Webserver und zeigt alle wichtigen Metriken in Echtzeit an.

## ✨ Features

### 📊 Echtzeit-Visualisierung
- **Live WebSocket Updates** - Sofortige Aktualisierung bei jedem Trade
- **Interaktive Charts** - Zoom, Hover-Tooltips, Responsive Design
- **Dark Theme** - Professionelles Design für lange Trading-Sessions
- **Auto-Reconnect** - Automatische Wiederverbindung bei Verbindungsabbruch

### 📈 Dargestellte Metriken

#### Key Performance Indicators (KPIs)
- **Total P&L** - Gesamtgewinn/-verlust (absolut & prozentual)
- **Current Equity** - Aktueller Portfolio-Wert mit Live-Preis
- **Win Rate** - Gewinnquote mit Win/Loss-Ratio
- **Profit Factor** - Verhältnis Bruttogewinn zu Bruttoverlust
- **Sharpe Ratio** - Risikoadjustierte Rendite
- **Max Drawdown** - Maximaler und aktueller Drawdown

#### Live Charts
1. **Equity Curve** - Portfolio-Entwicklung über Zeit
2. **P&L Distribution** - Verteilung der Gewinne/Verluste
3. **Drawdown Curve** - Verlauf der Drawdowns
4. **Recent Trades** - Tabelle der letzten 10 Trades

## 🎯 Verwendung

### Mit Backtest starten

```bash
# Backtest mit Live-Dashboard
npm run backtest:dashboard

# oder
npm run dashboard
```

Das Dashboard öffnet sich automatisch auf `http://localhost:3000`

### Port ändern

```bash
# Custom Port verwenden
DASHBOARD_PORT=8080 npm run dashboard
```

### Im Browser öffnen

Nach dem Start des Dashboards:
1. Öffnen Sie Ihren Browser
2. Navigieren Sie zu `http://localhost:3000`
3. Die Performance-Daten werden in Echtzeit aktualisiert

## 🔧 Integration in eigene Scripts

### Backtest mit Dashboard

```typescript
import { BacktestEngine } from './backtesting/backtest-engine';
import { DashboardServer } from './server/dashboard-server';
import { ConfigLoader } from './config/config-loader';

async function runBacktestWithDashboard() {
  // 1. Starte Dashboard Server
  const dashboard = new DashboardServer(3000);
  await dashboard.start();

  // 2. Erstelle Backtest Engine
  const config = ConfigLoader.loadConfig();
  const engine = new BacktestEngine(config);

  // 3. Verbinde Performance Tracker mit Dashboard
  const tracker = (engine as any).performanceTracker;
  tracker.connectToDashboard(dashboard);

  // 4. Starte Backtest
  const result = await engine.run();

  // Dashboard läuft weiter...
}
```

### Live Trading mit Dashboard

```typescript
import { TradingBot } from './trading/trading-bot';
import { DashboardServer } from './server/dashboard-server';

async function runLiveTradingWithDashboard() {
  // 1. Starte Dashboard
  const dashboard = new DashboardServer(3000);
  await dashboard.start();

  // 2. Erstelle Trading Bot
  const bot = new TradingBot(config);

  // 3. Verbinde mit Dashboard
  bot.performanceTracker.connectToDashboard(dashboard);

  // 4. Starte Bot
  await bot.start();

  // Dashboard zeigt Live-Updates
}
```

### Manuelles Update senden

```typescript
import { DashboardServer } from './server/dashboard-server';

const dashboard = new DashboardServer(3000);
await dashboard.start();

// Manuelles Update
dashboard.broadcastUpdate({
  stats: performanceStats,
  trades: closedTrades,
  initialCapital: 10000,
  currentPrice: 95432.50,
  timestamp: Date.now(),
});
```

## 🌐 API Endpoints

Das Dashboard bietet folgende HTTP-Endpoints:

### GET `/`
Hauptseite des Dashboards (HTML)

### GET `/api/data`
Aktuelle Performance-Daten als JSON

```json
{
  "stats": { ... },
  "trades": [ ... ],
  "initialCapital": 10000,
  "currentPrice": 95432.50,
  "timestamp": 1234567890
}
```

### GET `/health`
Health Check - Status des Servers

```json
{
  "status": "ok",
  "clients": 2
}
```

### WebSocket Connection
WebSocket auf gleicher URL für Live-Updates

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'update') {
    // Neue Daten verfügbar
    console.log(message.data);
  }
};
```

## 📱 Dashboard-Ansicht

### Header
- **Status-Indikator** - Grün bei Verbindung, Rot bei Disconnect
- **Live-Titel** - "AI DeepSeek Trader - Live Dashboard"
- **Last Update** - Timestamp der letzten Aktualisierung

### Stats Grid
6 KPI-Cards mit:
- Farbcodierung (Grün/Rot für positive/negative Werte)
- Hover-Effekte
- Zusätzliche Sub-Informationen

### Charts
- **Equity Curve** - Zeigt Portfolio-Entwicklung
- **P&L Distribution** - Bar Chart mit Win/Loss-Verteilung
- **Drawdown Curve** - Line Chart der Drawdowns

### Trades Table
Zeigt letzte 10 Trades mit:
- Zeitstempel
- Pair (z.B. BTC/USD)
- Aktion (BUY/SELL)
- Exit-Preis
- P&L (absolut & prozentual)
- Farbcodierung (Grün/Rot)

## 🎨 Design & Styling

### Dark Theme
- Hintergrund: `#0f172a` (Slate 900)
- Cards: `#1e293b` (Slate 800)
- Border: `#334155` (Slate 700)
- Akzent: Gradient `#667eea` → `#764ba2`

### Responsive Design
- Mobile-optimiert
- Grid-System passt sich an Bildschirmgröße an
- Charts skalieren automatisch

### Animationen
- Status-Indikator pulsiert
- Card Hover-Effekte
- Smooth Chart-Updates ohne Flackern

## 🔌 WebSocket Protocol

### Client → Server
Keine Nachrichten erforderlich (nur Connect/Disconnect)

### Server → Client

#### Update Message
```json
{
  "type": "update",
  "data": {
    "stats": { ... },
    "trades": [ ... ],
    "initialCapital": 10000,
    "currentPrice": 95432.50,
    "timestamp": 1234567890
  }
}
```

## ⚡ Performance

### Update-Frequenz
- **Bei Trade-Abschluss** - Sofortige Aktualisierung
- **Bei Equity-Update** - Bei jedem Candle
- **Throttling** - WebSocket sendet nur bei tatsächlichen Änderungen

### Browser-Performance
- **Chart.js** - Hardware-beschleunigte Canvas-Rendering
- **Update Mode** - Charts verwenden `update('none')` für bessere Performance
- **Point Decimation** - Automatische Reduktion bei zu vielen Datenpunkten

### Netzwerk
- **Kompression** - WebSocket-Nachrichten sind minimal
- **Reconnect Logic** - Automatisch nach 3 Sekunden
- **Keep-Alive** - WebSocket bleibt offen

## 🛠 Entwicklung

### Server erweitern

```typescript
// src/server/dashboard-server.ts

// Neuen Endpoint hinzufügen
this.app.get('/api/custom', (req, res) => {
  res.json({ custom: 'data' });
});

// Custom WebSocket Message
this.wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'custom',
    data: { ... }
  }));
});
```

### Frontend anpassen

Das Dashboard-HTML ist in [dashboard-server.ts](src/server/dashboard-server.ts) im `getDashboardHTML()` eingebettet.

Für größere Änderungen:
1. HTML-Template in separate Datei auslagern
2. CSS/JS in eigene Files
3. Mit `express.static()` ausliefern

## 🐛 Troubleshooting

### Port bereits belegt

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Lösung:**
```bash
# Anderen Port verwenden
DASHBOARD_PORT=8080 npm run dashboard
```

### Dashboard zeigt keine Daten

**Mögliche Ursachen:**
1. Performance Tracker nicht verbunden
2. Keine Trades ausgeführt
3. WebSocket-Verbindung fehlgeschlagen

**Lösung:**
- Browser-Console öffnen (F12)
- Network-Tab überprüfen
- WebSocket-Verbindung checken

### Charts werden nicht aktualisiert

**Lösung:**
1. Hard-Refresh im Browser (Ctrl+F5)
2. Chart.js CDN erreichbar prüfen
3. Browser-Console auf Fehler prüfen

### Server startet nicht

```bash
Error: Cannot find module 'express'
```

**Lösung:**
```bash
npm install
npm run build
npm run dashboard
```

## 📊 Beispiel-Session

```bash
$ npm run dashboard

╔════════════════════════════════════════════════════════════════╗
║    AI DEEPSEEK TRADER - BACKTESTING WITH LIVE DASHBOARD        ║
╚════════════════════════════════════════════════════════════════╝

📊 Dashboard server started: http://localhost:3000

🌐 Open your browser: http://localhost:3000

Press Ctrl+C to stop the backtest and server

[BACKTEST] 🚀 Starting backtest with live dashboard...
[BACKTEST] Loaded 1440 candles
[BACKTEST] Processing candles... (10%)
[DASHBOARD] New client connected
[PERFORMANCE] Trade recorded: WIN | P&L: $45.23
[DASHBOARD] Broadcasted update to 1 clients
...

✅ Backtest completed!
📊 Total Trades: 45
💰 Total P&L: $1,234.56 (12.35%)
📈 Win Rate: 67.5%

🌐 Dashboard still running at http://localhost:3000
Press Ctrl+C to stop the server
```

## 🔐 Sicherheit

### Lokaler Zugriff
- Dashboard ist standardmäßig nur auf `localhost` verfügbar
- Keine externe Exposition ohne Konfiguration

### Production Deployment
Für Production-Einsatz:
1. HTTPS aktivieren
2. Authentication hinzufügen
3. Rate Limiting implementieren
4. CORS konfigurieren

## 🚀 Erweiterte Features

### Multi-Client Support
- Mehrere Browser können gleichzeitig verbunden sein
- Alle Clients erhalten synchrone Updates

### Auto-Refresh
- Bei Verbindungsverlust automatische Wiederverbindung
- Status-Indikator zeigt Verbindungsstatus

### Export-Funktionen
Geplant für zukünftige Versionen:
- Screenshot-Export
- CSV-Export der Trades
- PDF-Report-Generation

## 📚 Weitere Ressourcen

- [Backtest Documentation](VISUALIZATION.md)
- [API Documentation](README.md)
- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**Entwickelt von**: Lead Developer Julia Kowalski
**Risk Management**: Ahmed Hassan (The Guardian)
**Powered by**: BMAD Method & DeepSeek AI
