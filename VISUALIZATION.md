# Performance Visualisierung

## Übersicht

Das AI DeepSeek Trader System verfügt über ein leistungsstarkes Visualisierungssystem für Performance-Statistiken, das sowohl für Backtesting als auch für Live-Trading verwendet werden kann.

## Features

### 📊 Grafische Darstellungen

1. **Equity Curve** - Zeigt die Entwicklung des Portfolio-Werts über die Zeit
2. **P&L Distribution** - Verteilung der Gewinne und Verluste nach Größe
3. **Drawdown Curve** - Visualisierung der Drawdowns über die Zeit
4. **Monthly Returns** - Monatliche Performance-Übersicht

### 📈 Key Performance Indicators (KPIs)

- Total P&L (absolut und prozentual)
- Win Rate (Gewinnquote)
- Profit Factor
- Sharpe Ratio
- Max Drawdown
- Total Trades
- Risk/Reward Ratio

## Verwendung

### Automatische Report-Generierung beim Backtesting

Wenn Sie einen Backtest durchführen, wird automatisch ein HTML-Report generiert und im Browser geöffnet:

```bash
npm run backtest
```

Der Report wird in `backtest_results/performance_report_[timestamp].html` gespeichert.

### Manuelle Report-Generierung

Sie können auch manuell Reports generieren:

```typescript
import { PerformanceTracker } from './backtesting/performance-stats';
import { ReportOpener } from './utils/report-opener';

// Erstelle Performance Tracker
const tracker = new PerformanceTracker(10000);

// ... führe Trades aus ...

// Generiere und speichere Report
const reportPath = await tracker.generatePerformanceReport(
  './reports/my-report.html',
  'My Custom Trading Strategy'
);

// Öffne im Browser
await ReportOpener.openInBrowser(reportPath);
```

### HTML String generieren (ohne Speichern)

```typescript
const htmlContent = tracker.generatePerformanceHTML('My Strategy');
// htmlContent kann nun per Email verschickt, in einer DB gespeichert, etc.
```

## Report-Struktur

### Stats Grid
Zeigt die wichtigsten KPIs in übersichtlichen Cards an:
- Farbcodierung: Grün für positive Werte, Rot für negative Werte
- Hover-Effekte für bessere Interaktivität

### Charts
Alle Charts sind interaktiv und basieren auf Chart.js:
- **Hover**: Zeigt detaillierte Werte für jeden Datenpunkt
- **Responsive**: Passt sich automatisch an die Bildschirmgröße an
- **Animiert**: Smooth Loading-Animationen

## Konfiguration

### Chart-Farben anpassen

Die Farben können in [performance-charts.ts](src/visualization/performance-charts.ts) angepasst werden:

```typescript
borderColor: '#667eea',  // Hauptfarbe für Linien
backgroundColor: 'rgba(102, 126, 234, 0.1)',  // Hintergrundfarbe mit Transparenz
```

### Report-Stil anpassen

Das HTML-Template in `generateHTMLReport()` kann vollständig angepasst werden:
- CSS-Styles im `<style>`-Tag
- Layout-Struktur im `<body>`-Tag
- Chart-Konfigurationen im `<script>`-Tag

## Technische Details

### Dependencies

- **Chart.js 4.4.0**: Leistungsstarke Charting-Bibliothek
- Lädt automatisch über CDN (keine lokale Installation erforderlich)

### Dateien

- [src/visualization/performance-charts.ts](src/visualization/performance-charts.ts) - Chart-Generator
- [src/backtesting/performance-stats.ts](src/backtesting/performance-stats.ts) - Performance Tracking
- [src/utils/report-opener.ts](src/utils/report-opener.ts) - Browser-Integration

### Chart-Datenformat

```typescript
interface ChartData {
  equityCurve: {
    labels: string[];      // Zeitstempel
    data: number[];        // Equity-Werte
  };
  pnlDistribution: {
    labels: string[];      // Buckets (z.B. "0% to 5%")
    wins: number[];        // Anzahl Gewinne pro Bucket
    losses: number[];      // Anzahl Verluste pro Bucket
  };
  monthlyReturns: {
    labels: string[];      // Monat (YYYY-MM)
    data: number[];        // Return in %
  };
  drawdownCurve: {
    labels: string[];      // Zeitstempel
    data: number[];        // Drawdown in %
  };
}
```

## Beispiel-Report

Nach dem Backtest erhalten Sie einen Report wie diesen:

```
╔════════════════════════════════════════════════════════════════╗
║   📊 Trading Performance Report                                ║
╚════════════════════════════════════════════════════════════════╝

┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Total P&L  │  Win Rate   │   Profit    │   Sharpe    │
│             │             │   Factor    │   Ratio     │
├─────────────┼─────────────┼─────────────┼─────────────┤
│  +$2,345.67 │    67.5%    │    2.45     │    1.82     │
│  +23.46%    │  27W / 13L  │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## Live Trading Integration

Das gleiche Visualisierungssystem kann auch für Live-Trading verwendet werden:

```typescript
// Im Live Trading Bot
setInterval(async () => {
  const reportPath = await performanceTracker.generatePerformanceReport(
    './reports/live-performance.html',
    'Live Trading Performance'
  );
  console.log(`Report updated: ${reportPath}`);
}, 60 * 60 * 1000); // Jede Stunde
```

## Troubleshooting

### Report öffnet sich nicht automatisch

Falls der Report nicht automatisch im Browser geöffnet wird:
1. Öffnen Sie die HTML-Datei manuell aus dem `backtest_results` Ordner
2. Der Pfad wird in der Console ausgegeben

### Charts werden nicht angezeigt

Stellen Sie sicher, dass:
1. Sie eine Internetverbindung haben (Chart.js wird von CDN geladen)
2. JavaScript im Browser aktiviert ist
3. Die HTML-Datei korrekt gespeichert wurde

### Fehlende Daten in Charts

Wenn Charts leer sind:
1. Überprüfen Sie, ob genug Trades ausgeführt wurden
2. Mindestens 2 Trades sind notwendig für aussagekräftige Charts
3. Prüfen Sie die Browser-Console auf Fehler

## Erweiterte Anwendungen

### Export als PDF

Sie können das HTML mit einem Tool wie Puppeteer als PDF exportieren:

```bash
npm install puppeteer
```

```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(`file://${reportPath}`);
await page.pdf({ path: 'report.pdf', format: 'A4' });
await browser.close();
```

### Report per Email versenden

```typescript
import nodemailer from 'nodemailer';

const htmlContent = tracker.generatePerformanceHTML('Daily Report');

await transporter.sendMail({
  from: 'bot@example.com',
  to: 'trader@example.com',
  subject: 'Daily Trading Performance',
  html: htmlContent
});
```

## Entwickler-Hinweise

### Neue Charts hinzufügen

1. Fügen Sie die Daten-Generierung in `generateChartData()` hinzu
2. Erweitern Sie das `ChartData` Interface
3. Fügen Sie ein neues `<canvas>` Element im HTML hinzu
4. Erstellen Sie den Chart im `<script>` Bereich

### Performance optimieren

- Limitieren Sie die Anzahl der Datenpunkte für große Datensätze
- Verwenden Sie `pointRadius: 0` für bessere Performance
- Nutzen Sie Decimation für sehr große Equity Curves

## Support

Bei Fragen oder Problemen:
- Überprüfen Sie die Console-Logs
- Schauen Sie in die TypeScript-Dateien für Details
- Öffnen Sie ein Issue im Repository

---

**Entwickelt von**: Lead Developer Julia Kowalski
**Risk Management**: Ahmed Hassan (The Guardian)
**Powered by**: BMAD Method & DeepSeek AI
