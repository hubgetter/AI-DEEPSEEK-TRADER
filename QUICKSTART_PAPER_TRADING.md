# Quick Start: Paper Trading

## 🎯 In 3 Minuten Paper Trading starten

### Schritt 1: Installation

```bash
npm install
```

### Schritt 2: DeepSeek API Key

Öffne die `.env` Datei und trage deinen API Key ein:

```env
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

**API Key erhalten:**
1. Gehe zu https://platform.deepseek.com/
2. Registriere dich
3. Erstelle einen API Key

### Schritt 3: Paper Trading starten

```bash
npm run live
```

Das war's! 🚀

## 📊 Was passiert jetzt?

1. **Dashboard öffnet sich** auf `http://localhost:3000`
2. **Live-Daten** werden von Kraken geladen
3. **AI analysiert** den Markt alle 5 Minuten
4. **Trades werden simuliert** (keine echten Orders!)
5. **Performance** wird im Dashboard angezeigt

## 🎨 Dashboard

Öffne in deinem Browser: `http://localhost:3000`

Du siehst:
- ✅ Live Equity Curve
- ✅ Win Rate & Sharpe Ratio
- ✅ Recent Trades
- ✅ P&L Distribution

## ⚡ Wichtige Befehle

```bash
# Paper Trading MIT Dashboard (EMPFOHLEN)
npm run live

# Paper Trading OHNE Dashboard
npm run paper

# Backtest (historische Daten)
npm run dashboard

# Stoppen
Ctrl+C
```

## 🔧 Konfiguration anpassen

In der [.env](.env) Datei:

```env
# Trading Pair ändern
TRADING_PAIR=BTC/USD        # oder ETH/USD, etc.

# Timeframe ändern
TIMEFRAME=5m                # 1m, 5m, 15m, 1h, etc.

# Startkapital ändern
INITIAL_CAPITAL=10000       # Beliebiger Betrag
```

## ⚠️ Wichtig

- **Paper Trading = 100% simuliert**
- **Keine echten Orders**
- **Keine Kraken API Keys erforderlich**
- **Risikofrei zum Testen**

## 📚 Mehr Details

Siehe [PAPER_TRADING.md](PAPER_TRADING.md) für:
- Ausführliche Dokumentation
- Troubleshooting
- Best Practices
- Performance-Optimierung

## 🚀 Nächste Schritte

1. **Laufen lassen** - Mindestens 1 Woche
2. **Performance beobachten** - Im Dashboard
3. **Parameter optimieren** - In `.env`
4. **Wiederholen** - Bis Performance stimmt

## 💡 Tipps

- **Starte mit 5m Timeframe** - Gute Balance zwischen Updates und API-Load
- **Überwache das Dashboard** - Prüfe Win Rate und Sharpe Ratio
- **Warte auf 50+ Trades** - Erst dann ist Performance aussagekräftig
- **Optimiere vorsichtig** - Nicht zu früh Parameter ändern

---

**Viel Erfolg!** 🎉
