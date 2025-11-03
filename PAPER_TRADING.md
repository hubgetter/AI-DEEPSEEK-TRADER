# Paper Trading - Live Simulation

## 🎯 Was ist Paper Trading?

**Paper Trading** ist eine Live-Trading-Simulation, bei der:
- ✅ **Live-Daten** von Kraken in Echtzeit verwendet werden
- ✅ **AI-Entscheidungen** in Echtzeit getroffen werden
- ✅ **Trades simuliert** werden (keine echten Orders!)
- ✅ **Performance evaluiert** wird im Live-Umfeld

**Perfekt zur Evaluation**, bevor echtes Kapital eingesetzt wird!

## 🚀 Quick Start

### Mit Live-Dashboard (EMPFOHLEN)

```bash
npm run live
# oder
npm run paper:dashboard
```

Das Dashboard öffnet sich auf `http://localhost:3000` und zeigt:
- Live Performance-Metriken
- Echtzeit-Charts
- Trade-History
- Portfolio-Status

### Ohne Dashboard (Konsole)

```bash
npm run paper
```

Alle Informationen werden in der Konsole angezeigt.

## 📊 Wie funktioniert es?

```
┌─────────────────────────────────────────────────┐
│  1. Lade initiale Historie (für Indikatoren)    │
│     → Letzte 24h Candles von Kraken             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  2. Polling-Loop startet                        │
│     → Alle X Minuten (gemäß TIMEFRAME)          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  3. Für jede neue Candle:                       │
│     → Hole Live-Daten von Kraken                │
│     → Berechne technische Indikatoren           │
│     → AI trifft Trading-Entscheidung            │
│     → Risk Management prüft Trade               │
│     → Simuliere Trade (kein echter Order!)      │
│     → Update Dashboard                          │
└─────────────────────────────────────────────────┘
```

## 🔧 Konfiguration

Alle Einstellungen werden aus der [.env](.env) Datei geladen.

### Wichtige Parameter für Paper Trading

```env
# Trading Pair & Timeframe
TRADING_PAIR=BTC/USD
TIMEFRAME=5m                    # Wie oft neue Candles geholt werden

# Kapital
INITIAL_CAPITAL=10000           # Startkapital für Simulation

# DeepSeek API
DEEPSEEK_API_KEY=sk-xxx         # Erforderlich für AI-Entscheidungen

# Kraken API (OPTIONAL für Paper Trading)
KRAKEN_API_KEY=                 # Nicht erforderlich für Paper Trading
KRAKEN_API_SECRET=              # Nur für echtes Live Trading
```

**Hinweis:** Für Paper Trading benötigst du **KEINE** Kraken API Keys! Nur für echtes Live Trading (noch nicht implementiert).

## 📈 Timeframes

Du kannst verschiedene Timeframes testen:

| Timeframe | Update-Intervall | Use Case                          |
| --------- | ---------------- | --------------------------------- |
| `1m`      | Jede Minute      | High-Frequency Trading            |
| `5m`      | Alle 5 Minuten   | Kurzfristige Trades (Standard)    |
| `15m`     | Alle 15 Minuten  | Mittelfristige Trades             |
| `1h`      | Jede Stunde      | Langfristige Trades               |
| `4h`      | Alle 4 Stunden   | Swing Trading                     |
| `1d`      | Täglich          | Position Trading                  |

**Empfehlung:** Starte mit `5m` für häufige Updates ohne zu viel API-Load.

## 💡 Beispiel-Session

```bash
$ npm run live

╔════════════════════════════════════════════════════════════════╗
║   AI DEEPSEEK TRADER - PAPER TRADING WITH LIVE DASHBOARD      ║
╚════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════
                  TRADING CONFIGURATION
═══════════════════════════════════════════════════════════════
Trading Pair:       BTC/USD
Timeframe:          5m
Initial Capital:    $10000.00
...

📊 Dashboard server started: http://localhost:3000
🌐 Open your browser: http://localhost:3000

╔════════════════════════════════════════════════════════════════╗
║         PAPER TRADING - LIVE SIMULATION ACTIVE                 ║
╚════════════════════════════════════════════════════════════════╝

⚠️  Paper Trading Mode: Trades are SIMULATED, no real orders!
📊 Using LIVE data from Kraken
🤖 AI makes real-time trading decisions

📈 Loaded 288 candles for technical analysis

✅ Paper Trading is running. Press Ctrl+C to stop.


📊 [2024-01-15 14:35:00] Price: $43,582.50
🤖 AI analyzing market...
💭 AI Decision: HOLD - Market showing consolidation pattern...
📊 Position: HOLD

📊 [2024-01-15 14:40:00] Price: $43,625.80
🤖 AI analyzing market...
💭 AI Decision: BUY - Strong bullish divergence detected...

🟢 BUY SIGNAL (SIMULATED)
   Price: $43,625.80
   Quantity: 0.22940115
   Value: $10,000.00
   Stop Loss: $42,753.28
   Take Profit: $44,934.58

📊 [2024-01-15 14:45:00] Price: $43,890.20
   Current Position P&L: +$60.64 (0.61%)

📊 [2024-01-15 14:50:00] Price: $44,250.00
🎯 Take Profit triggered at $44,250.00

🟢 SELL SIGNAL (SIMULATED)
   Exit Price: $44,250.00
   P&L: +$143.15 (+1.43%)
   Reason: Take Profit triggered
   New Equity: $10,143.15

...
```

## 🎨 Live Dashboard Features

Wenn du `npm run live` oder `npm run paper:dashboard` verwendest:

### Real-Time Metriken
- **Total P&L** - Gesamtgewinn/-verlust
- **Current Equity** - Aktueller Portfolio-Wert
- **Win Rate** - Gewinnquote
- **Sharpe Ratio** - Risikoadjustierte Rendite
- **Max Drawdown** - Größter Verlust vom Peak

### Live Charts
- **Equity Curve** - Portfolio-Entwicklung in Echtzeit
- **P&L Distribution** - Verteilung der Trades
- **Drawdown Curve** - Drawdown-Verlauf
- **Recent Trades** - Letzte 10 Trades

### Auto-Update
- Dashboard aktualisiert sich automatisch bei jedem Trade
- WebSocket-Verbindung für sofortige Updates
- Keine Page-Reloads erforderlich

## ⚡ Performance & Ressourcen

### API Rate Limits (Kraken Public API)

- **OHLC Calls:** ~1 Request/Sekunde
- **Ticker Calls:** ~1 Request/Sekunde
- **Paper Trading:** Sehr API-freundlich (nur neue Candles)

### Timeframe vs. API Load

| Timeframe | Calls pro Stunde | API Load  |
| --------- | ---------------- | --------- |
| `1m`      | ~60              | Hoch      |
| `5m`      | ~12              | Mittel    |
| `15m`     | ~4               | Niedrig   |
| `1h`      | ~1               | Sehr niedrig |

**Empfehlung:** Für 24/7 Paper Trading verwende `5m` oder `15m`.

### DeepSeek API Kosten

- **Paper Trading:** ~1 AI Call pro Candle
- **5m Timeframe:** ~12 Calls/Stunde = ~288 Calls/Tag
- **DeepSeek Kosten:** ~$0.14/1M Input Tokens, ~$0.28/1M Output Tokens
- **Geschätzte Kosten:** ~$0.50 - $2.00 pro Tag (je nach Timeframe)

## 🛑 Stoppen

**Graceful Shutdown:**
```bash
# Im Terminal: Ctrl+C drücken
^C

⚠️  Stopping Paper Trading and Dashboard...

🛑 Paper Trading stopped

📊 Final Performance:
   Total Trades: 12
   Final Equity: $10,245.67
   Total P&L: +$245.67
```

Alle offenen Positionen werden automatisch geschlossen.

## 📁 Logs & Daten

### Log-Dateien

Alle Aktivitäten werden geloggt:

```
logs/
├── combined.log      # Alle Logs
├── trading.log       # Trade-spezifische Logs
└── error.log         # Nur Fehler
```

### Performance-Daten

- Im Dashboard live sichtbar
- In Logs gespeichert
- Performance Tracker sammelt alle Metriken

## 🔒 Sicherheit

### Paper Trading ist 100% sicher

✅ **Keine echten Orders** - Alle Trades sind simuliert
✅ **Keine Kraken API Keys erforderlich** - Nur Public Data
✅ **Kein Kapitalrisiko** - Nur Simulation
✅ **Beliebig testbar** - So oft du willst

### Für echtes Live Trading (noch nicht implementiert)

Wenn echtes Live Trading aktiviert wird:
- ⚠️ Kraken API Keys erforderlich
- ⚠️ Echte Orders werden platziert
- ⚠️ Kapitalrisiko vorhanden
- ⚠️ Nur nach erfolgreicher Paper Trading Phase!

## 🐛 Troubleshooting

### "Failed to fetch OHLC data"

**Problem:** Kraken API Rate Limit erreicht
**Lösung:**
- Warte 1 Minute und versuche es erneut
- Verwende größeren Timeframe (z.B. `15m` statt `5m`)

### "DEEPSEEK_API_KEY is required"

**Problem:** API Key nicht in `.env` gesetzt
**Lösung:**
- Öffne `.env`
- Trage deinen DeepSeek API Key ein
- Starte Paper Trading neu

### "No new candle yet, waiting..."

**Problem:** Normale Ausgabe - keine neue Candle verfügbar
**Lösung:**
- Warten bis nächster Candle-Close
- Bei `5m` Timeframe: Alle 5 Minuten neue Candle
- Dies ist normales Verhalten

### Dashboard zeigt keine Daten

**Problem:** Dashboard nicht verbunden oder keine Trades
**Lösung:**
1. Browser-Console öffnen (F12)
2. Prüfe WebSocket-Verbindung
3. Warte auf ersten Trade
4. Hard-Refresh (Ctrl+F5)

## 📊 Vergleich: Backtest vs. Paper Trading

| Feature                  | Backtest          | Paper Trading     |
| ------------------------ | ----------------- | ----------------- |
| **Daten**                | Historisch        | Live (Echtzeit)   |
| **Geschwindigkeit**      | Sehr schnell      | Echtzeit          |
| **Zeitraum**             | Frei wählbar      | Aktuell (laufend) |
| **Ausführung**           | Simuliert         | Simuliert         |
| **Use Case**             | Strategie-Test    | Live-Evaluation   |
| **Dashboard**            | ✅ Ja             | ✅ Ja             |
| **API Kosten**           | Einmalig          | Laufend           |

**Workflow:**
1. **Backtest** - Strategie mit historischen Daten testen
2. **Paper Trading** - Strategie mit Live-Daten evaluieren
3. **Live Trading** - Echtes Trading (noch nicht implementiert)

## 🎯 Best Practices

### 1. Starte mit Backtest

Bevor du Paper Trading startest:
```bash
# 1. Führe mehrere Backtests durch
npm run dashboard

# 2. Validiere Performance-Kriterien
# - Win Rate > 55%
# - Sharpe Ratio > 2.0
# - Max Drawdown < 15%

# 3. Erst dann Paper Trading
npm run live
```

### 2. Optimale Timeframes

**Für Testing:**
- `5m` - Häufige Updates, gute Balance
- `15m` - Weniger API Load, trotzdem aktiv

**Für 24/7 Paper Trading:**
- `15m` oder `1h` - Niedrige API & DeepSeek Kosten

### 3. Überwache Performance

- Dashboard regelmäßig prüfen
- Logs analysieren
- Performance-Metriken beobachten
- Nach 100+ Trades evaluieren

### 4. Parameter-Optimierung

Wenn Paper Trading läuft:
- **Nicht sofort Parameter ändern**
- Mindestens 50-100 Trades sammeln
- Dann in `.env` optimieren
- Neues Paper Trading starten

## 🚀 Nächste Schritte

### Nach erfolgreichem Paper Trading

1. **Analyse** - Mindestens 1 Woche Paper Trading
2. **Validation** - Performance-Kriterien erfüllt?
3. **Optimierung** - Parameter fine-tunen
4. **Wiederholung** - Erneut Paper Trading
5. **Live Trading** - Erst nach mehreren erfolgreichen Wochen

## 📚 Weitere Dokumentation

- [README.md](README.md) - Projekt-Übersicht
- [SETUP.md](SETUP.md) - Installation & Konfiguration
- [DASHBOARD.md](DASHBOARD.md) - Dashboard-Dokumentation
- [.env](.env) - Alle Konfigurationsparameter

## 💬 Support

Bei Fragen oder Problemen:
1. Prüfe die Logs in `logs/`
2. Lies diese Dokumentation
3. Validiere `.env` Konfiguration

---

**Entwickelt von**: Lead Developer Julia Kowalski
**Risk Management**: Ahmed Hassan (The Guardian)
**Powered by**: BMAD Method & DeepSeek AI

**Wichtiger Hinweis**: Paper Trading ist risikofrei und perfekt zum Testen. Echtes Live Trading sollte erst nach ausführlicher Paper Trading Phase aktiviert werden!
