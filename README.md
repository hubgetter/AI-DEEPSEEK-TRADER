# AI DeepSeek Trader

AI-gestützter Kryptowährungs-Trader mit DeepSeek für KI-Entscheidungen und Kraken Exchange Integration.

## Quick Start

```bash
# 1. Dependencies installieren
npm install

# 2. .env Datei konfigurieren (DeepSeek API Key eintragen)
# Bearbeite .env und füge deinen API Key ein

# 3a. Backtest mit Live-Dashboard starten (EMPFOHLEN ZUERST)
npm run dashboard

# 3b. Paper Trading - Live Simulation (NEU!)
npm run live

# 3c. Oder: Nur Backtest ohne Dashboard
npm run backtest
```

🎯 **Neu:** Paper Trading mit Live-Daten! Siehe [PAPER_TRADING.md](PAPER_TRADING.md)

## Features

- **📄 Paper Trading** - Live Simulation mit echten Daten (NEU!)
- **🎨 Live Web-Dashboard** mit Echtzeit-Visualisierung
- **📊 Interaktive Charts** - Equity Curve, P&L Distribution, Drawdown
- **⚡ WebSocket Updates** - Sofortige Aktualisierung bei jedem Trade
- **🤖 KI-gesteuerte Trading-Entscheidungen** mit DeepSeek Modell
- **🔄 Backtesting-Engine** mit historischen Kraken-Daten
- **📈 Umfassende Performance-Statistiken** (Sharpe Ratio, Win Rate, Max Drawdown, etc.)
- **🛡️ Risk Management** mit Circuit Breakers und Position Sizing
- **📉 Technische Indikatoren** (RSI, MACD, Bollinger Bands, Volume Profile)
- **📋 Detailliertes Logging** für alle Trading-Aktivitäten

## Architektur

```
ai-deepseek-trader/
├── src/
│   ├── data/              # Datenquellen (Kraken API)
│   ├── ai/                # DeepSeek Integration
│   ├── backtesting/       # Simulation Engine
│   ├── trading/           # Trading Logik
│   ├── indicators/        # Technische Indikatoren
│   ├── risk/              # Risk Management
│   ├── live/              # Live Trading
│   └── utils/             # Logging & Reporting
├── tests/
└── config/
```

## Installation

```bash
npm install
```

## Konfiguration

Die `.env` Datei ist bereits vorkonfiguriert. Du musst nur deinen DeepSeek API Key eintragen:

```env
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

**DeepSeek API Key erhalten:**
1. Gehe zu https://platform.deepseek.com/
2. Registriere dich / Melde dich an
3. Erstelle einen API Key
4. Trage ihn in die `.env` Datei ein

**Optionale Anpassungen:**
- `BACKTEST_START_DATE` / `BACKTEST_END_DATE` - Zeitraum für Backtesting
- `TRADING_PAIR` - z.B. BTC/USD, ETH/USD
- `TIMEFRAME` - z.B. 1m, 5m, 15m, 1h
- `INITIAL_CAPITAL` - Startkapital für Simulation

Siehe [SETUP.md](SETUP.md) für detaillierte Konfigurationsoptionen.

## Verwendung

### 1. Backtesting (EMPFOHLEN ZUERST)

```bash
npm run dashboard
```

Dies startet einen vollständigen Backtest mit:
- Historischen Kraken-Daten
- KI-Entscheidungen für jede Kerze
- Realistischer Simulation (Fees, Slippage)
- Detaillierten Performance-Statistiken
- Live-Dashboard auf `http://localhost:3000`

**Ergebnisse:** Gespeichert in `backtest_results/`

### 2. Paper Trading - Live Simulation (NEU!)

```bash
npm run live
```

Paper Trading verwendet:
- ✅ **Live-Daten** von Kraken in Echtzeit
- ✅ **Simulierte Trades** (keine echten Orders!)
- ✅ **Live-Dashboard** mit Echtzeit-Updates
- ✅ **Performance-Evaluation** im Live-Umfeld

**Perfekt zur Evaluation**, bevor echtes Kapital eingesetzt wird!

Siehe [PAPER_TRADING.md](PAPER_TRADING.md) für Details.

### 3. Live Trading (Zukünftig)

Echtes Live Trading wird erst nach erfolgreicher Paper Trading Phase aktiviert.

## Trading Regeln (von Expert Team)

### Risk Management
- Max 2% Kapital pro Trade
- Stop-Loss ist PFLICHT
- Tägliches Loss-Limit: 5%
- Circuit Breaker nach 3 aufeinanderfolgenden Verlusten

### KPIs für Erfolg
- Sharpe Ratio > 2.0
- Win Rate > 55%
- Max Drawdown < 15%
- Profit Factor > 1.5

### Technische Analyse
- RSI (Überkauft/Überverkauft)
- MACD (Trend-Momentum)
- Bollinger Bands (Volatilität)
- Volume Profile (Liquidität)

## Projektstruktur

```
AI-deepseek-trader/
├── src/
│   ├── ai/                    # DeepSeek Integration
│   │   ├── deepseek-client.ts
│   │   └── prompt-builder.ts
│   ├── backtesting/           # Backtesting Engine
│   │   ├── backtest-engine.ts
│   │   └── performance-stats.ts
│   ├── data/                  # Kraken API Client
│   │   └── kraken-client.ts
│   ├── indicators/            # Technische Indikatoren
│   │   └── technical-indicators.ts
│   ├── risk/                  # Risk Management
│   │   └── risk-manager.ts
│   ├── utils/                 # Logger & Reporter
│   │   ├── logger.ts
│   │   └── console-reporter.ts
│   ├── config/                # Configuration
│   │   └── config-loader.ts
│   └── types/                 # TypeScript Types
│       └── index.ts
├── logs/                      # Log-Dateien
├── backtest_results/          # Backtest-Ergebnisse
├── .env                       # Konfiguration
└── SETUP.md                   # Detaillierte Anleitung
```

## Entwickelt von

**Software Development Team:**
- Projektmanager: Sarah Chen
- Product Owner: Marcus Weber
- Architekt: Dr. Andreas Müller
- Lead Developer: Julia Kowalski
- Senior Developer: Raj Patel
- Developers: Emma Schmidt, Carlos Rodriguez, Yuki Tanaka
- QA Tester: Michael Brown

**Finance & Trading Experts:**
- The Quant: David Sterling (5M€/Jahr)
- Speed Demon: Lisa Wang (2M€/Jahr)
- The Guardian: Ahmed Hassan (3M€/Jahr)
- Chart Master: Sofia Petrov (1.8M€/Jahr)
- The Mind Reader: James O'Connor (2.5M€/Jahr)

## Weitere Dokumentation

- [PAPER_TRADING.md](PAPER_TRADING.md) - Paper Trading Guide (NEU!)
- [SETUP.md](SETUP.md) - Detaillierte Setup-Anleitung
- [DASHBOARD.md](DASHBOARD.md) - Live Dashboard Dokumentation
- [.env](.env) - Konfigurationsparameter erklärt

## Support & Issues

Bei Problemen:
1. Prüfe die Logs in `logs/`
2. Lies [SETUP.md](SETUP.md) für Troubleshooting
3. Validiere deine `.env` Konfiguration

## Lizenz

MIT

---

**Wichtiger Hinweis:** Dies ist eine Trading-Software. Nutze sie verantwortungsvoll und starte IMMER mit Backtesting, bevor du Live Trading aktivierst!
