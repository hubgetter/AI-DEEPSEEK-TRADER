# 🚀 Quick Start - Live Dashboard

## In 3 Schritten zum Live-Dashboard

### 1. Dependencies installieren (falls noch nicht geschehen)

```bash
npm install
```

### 2. Konfiguration prüfen

Stelle sicher, dass `.env` und `config.json` korrekt konfiguriert sind:

```bash
# .env
DEEPSEEK_API_KEY=your_api_key_here
KRAKEN_API_KEY=your_key_here  # Optional für Backtest
KRAKEN_API_SECRET=your_secret_here  # Optional für Backtest
```

### 3. Dashboard starten

```bash
npm run dashboard
```

Das war's! 🎉

## Was passiert jetzt?

1. **Server startet** auf `http://localhost:3000`
2. **Öffne Browser** und gehe zu `http://localhost:3000`
3. **Backtest läuft** und Dashboard zeigt Live-Updates
4. **Charts aktualisieren** sich automatisch bei jedem Trade

## Dashboard-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│  🟢  AI DeepSeek Trader - Live Dashboard                   │
│  Real-time Performance Monitoring | Last update: 14:32:15  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Total P&L   │ Current      │   Win Rate   │   Profit     │
│              │  Equity      │              │   Factor     │
├──────────────┼──────────────┼──────────────┼──────────────┤
│  +$1,234.56  │  $11,234.56  │    67.5%     │     2.45     │
│   +12.35%    │  Price:      │   27W / 13L  │              │
│              │  $95,432.50  │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📈 Equity Curve                                            │
│                                                             │
│  [Interactive Line Chart showing portfolio growth]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────┬───────────────────────────────┐
│  📊 P&L Distribution        │  📉 Drawdown Curve            │
│                             │                               │
│  [Bar Chart Win/Loss]       │  [Line Chart Drawdowns]       │
│                             │                               │
└─────────────────────────────┴───────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📋 Recent Trades                                           │
├──────────┬────────┬────────┬──────────┬──────────┬─────────┤
│   Time   │  Pair  │ Action │  Price   │   P&L    │  P&L %  │
├──────────┼────────┼────────┼──────────┼──────────┼─────────┤
│ 14:32:15 │BTC/USD │  SELL  │ $95,432  │  +$45.23 │ +2.34%  │
│ 14:28:10 │BTC/USD │  BUY   │ $95,120  │  -$12.45 │ -0.65%  │
└──────────┴────────┴────────┴──────────┴──────────┴─────────┘
```

## Wichtige Befehle

```bash
# Dashboard mit Backtest starten
npm run dashboard

# Nur Backtest (ohne Dashboard)
npm run backtest

# Custom Port
DASHBOARD_PORT=8080 npm run dashboard

# Stoppen
Ctrl + C
```

## Features im Überblick

### ✅ Echtzeit-Updates
- Automatische Aktualisierung bei jedem Trade
- Keine manuelle Refresh notwendig
- WebSocket-basiert für sofortige Updates

### ✅ Interaktive Charts
- **Hover** über Charts für Details
- **Equity Curve** - Portfolio-Entwicklung
- **P&L Distribution** - Win/Loss-Verteilung
- **Drawdown Curve** - Risiko-Visualisierung

### ✅ Live KPIs
- Total P&L (Profit & Loss)
- Current Equity + Live Price
- Win Rate (Gewinnquote)
- Profit Factor
- Sharpe Ratio
- Max Drawdown

### ✅ Trade History
- Letzte 10 Trades in Echtzeit
- Farbcodierung (Grün = Win, Rot = Loss)
- Detaillierte Informationen

## Tipps & Tricks

### Multi-Monitor Setup
Öffne das Dashboard auf einem zweiten Monitor während der Backtest läuft.

### Mobile Ansicht
Dashboard ist responsive - öffne `http://[YOUR-IP]:3000` auf dem Handy.

### Screenshot Export
Browser-Screenshot-Tool nutzen (z.B. `Win + Shift + S` auf Windows).

### Mehrere Browser
Du kannst mehrere Browser-Tabs öffnen - alle zeigen die gleichen Daten.

## Troubleshooting

### Port bereits belegt?
```bash
DASHBOARD_PORT=8080 npm run dashboard
```

### Dashboard zeigt keine Daten?
1. Warte bis erster Trade ausgeführt wurde
2. Prüfe Browser-Console (F12)
3. Überprüfe WebSocket-Verbindung (sollte grün sein)

### Server startet nicht?
```bash
npm install
npm run build
```

## Nächste Schritte

📖 Mehr Details: [DASHBOARD.md](DASHBOARD.md)
📊 Visualisierung: [VISUALIZATION.md](VISUALIZATION.md)
🔧 Konfiguration: [README.md](README.md)

---

**Viel Erfolg beim Trading! 🚀📈**
