# AI DeepSeek Trader - Setup Guide

## Voraussetzungen

- Node.js 18+ installiert
- DeepSeek API Key (https://platform.deepseek.com/)
- Kraken Account (optional, für Live Trading später)

## Installation

### 1. Dependencies installieren

```bash
npm install
```

### 2. Konfiguration

Bearbeite die `.env` Datei und füge deinen DeepSeek API Key ein:

```env
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

### 3. Backtesting-Zeitraum anpassen (optional)

In der `.env` Datei kannst du den Zeitraum für Backtesting anpassen:

```env
BACKTEST_START_DATE=2024-01-01
BACKTEST_END_DATE=2024-03-31
```

**Empfehlung:** Starte mit einem kürzeren Zeitraum (1-2 Monate) für schnellere Tests.

## Verwendung

### Backtesting starten

```bash
npm run backtest
```

Dies wird:
1. Historische Daten von Kraken laden
2. Für jede Kerze (Candle) eine KI-Entscheidung treffen
3. Trades simulieren mit realistischen Fees und Slippage
4. Performance-Statistiken berechnen
5. Ergebnisse in `backtest_results/` speichern

### Erwartete Ausgabe

```
╔════════════════════════════════════════════════════════════════╗
║         AI DEEPSEEK TRADER - BACKTESTING MODE                  ║
╚════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════
                  TRADING CONFIGURATION
═══════════════════════════════════════════════════════════════
Trading Pair:       BTC/USD
Timeframe:          5m
Initial Capital:    $10000.00
...

Backtesting: [████████████████████████████████████████] 100.0%

╔════════════════════════════════════════════════════════════════╗
║              BACKTEST RESULTS - SUMMARY                        ║
╚════════════════════════════════════════════════════════════════╝

Performance Statistics:
  Total Trades: 47
  Win Rate: 58.00%
  Sharpe Ratio: 2.10
  ...
```

## Wichtige Metriken

### Erfolgs-Kriterien (von Expert Team definiert)

Damit die Strategie als "bereit für Live Trading" gilt:

- ✅ **Win Rate > 55%**
- ✅ **Sharpe Ratio > 2.0**
- ✅ **Max Drawdown < 15%**
- ✅ **Profit Factor > 1.5**
- ✅ **Positive P&L**

## Konfigurationsparameter erklärt

### Risk Management

```env
RISK_PER_TRADE=0.02          # 2% des Kapitals pro Trade riskieren
MAX_DRAWDOWN=0.15             # Max. 15% Verlust vom Peak
DAILY_LOSS_LIMIT=0.05         # Max. 5% Verlust pro Tag
MAX_CONSECUTIVE_LOSSES=3      # Nach 3 Verlusten: Trading stoppen
```

### Stop Loss & Take Profit

```env
STOP_LOSS_PERCENTAGE=0.02     # 2% Stop Loss
TAKE_PROFIT_PERCENTAGE=0.03   # 3% Take Profit (1:1.5 Risk/Reward)
```

### Position Sizing

```env
MAX_POSITION_SIZE=0.25        # Max. 25% des Portfolios in einem Trade
```

## Troubleshooting

### Fehler: "DEEPSEEK_API_KEY is required"

→ Stelle sicher, dass du deinen API Key in der `.env` Datei eingetragen hast.

### Fehler: "Not enough candles for indicator calculation"

→ Der Backtesting-Zeitraum ist zu kurz. Mindestens 50 Candles werden benötigt.

### Fehler: "Failed to fetch OHLC data"

→ Kraken API Rate Limit erreicht. Warte 1 Minute und versuche es erneut.

### Sehr langsamer Backtest

→ DeepSeek API Calls benötigen Zeit. Für schnellere Tests:
- Kürzerer Zeitraum wählen
- Größerer Timeframe (z.B. 15m statt 5m)

## Nächste Schritte

### Nach erfolgreichem Backtesting:

1. **Analysiere die Ergebnisse** in `backtest_results/*.json`
2. **Optimiere Parameter** in der `.env` Datei
3. **Mehrere Backtests** mit verschiedenen Zeiträumen durchführen
4. **Live Trading** aktivieren (nach erfolgreicher Validierung)

### Parameter-Optimierung

Experimentiere mit:
- Verschiedenen Timeframes (1m, 5m, 15m)
- Risk/Reward Ratios (Stop Loss / Take Profit)
- Position Sizing
- Trading Pairs (ETH/USD, etc.)

## Logs

Alle Aktivitäten werden geloggt in:
- `logs/combined.log` - Alle Logs
- `logs/trading.log` - Trading-spezifische Logs
- `logs/error.log` - Nur Fehler

## Team Credits

**Software Development Team:**
- Projektmanager: Sarah Chen
- Product Owner: Marcus Weber
- Architekt: Dr. Andreas Müller
- Lead Developer: Julia Kowalski
- Senior Developer: Raj Patel
- Developer: Emma Schmidt, Carlos Rodriguez, Yuki Tanaka
- QA Tester: Michael Brown

**Finance & Trading Experts:**
- The Quant: David Sterling
- Speed Demon: Lisa Wang
- The Guardian: Ahmed Hassan
- Chart Master: Sofia Petrov
- The Mind Reader: James O'Connor

## Support

Bei Problemen:
1. Prüfe die Logs in `logs/`
2. Validiere deine `.env` Konfiguration
3. Stelle sicher, dass alle Dependencies installiert sind

---

**Wichtig:** Dies ist Trading-Software. Starte immer mit Backtesting bevor du Live Trading aktivierst!
