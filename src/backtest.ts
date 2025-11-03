/**
 * Backtest Entry Point
 * Startet den Backtesting-Modus
 */

import { ConfigLoader } from './config/config-loader';
import { BacktestEngine } from './backtesting/backtest-engine';
import { logger } from './utils/logger';
import { ReportOpener } from './utils/report-opener';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         AI DEEPSEEK TRADER - BACKTESTING MODE                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Lade Konfiguration
    const config = ConfigLoader.loadConfig();
    ConfigLoader.validateConfig(config);
    ConfigLoader.printConfig(config);

    // 2. Erstelle Backtest Engine
    const engine = new BacktestEngine(config);

    // 3. Starte Backtest
    const result = await engine.run();

    // 4. Speichere Ergebnisse
    const resultsDir = path.join(process.cwd(), 'backtest_results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `backtest_${config.pair.replace('/', '_')}_${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');

    logger.info('BACKTEST', `Results saved to: ${filepath}`);
    console.log(`\n📊 Results saved to: ${filepath}`);

    // 5. Generiere und öffne Performance Report
    const reportPath = path.join(resultsDir, `performance_report_${timestamp}.html`);
    const htmlContent = engine.getPerformanceHTML(
      `Backtest Report: ${config.pair} (${result.startDate.toLocaleDateString()} - ${result.endDate.toLocaleDateString()})`
    );

    await ReportOpener.createAndOpen(htmlContent, reportPath);
    console.log(`📈 Performance report opened: ${reportPath}\n`);

    // 5. Exit
    process.exit(0);
  } catch (error: any) {
    logger.error('BACKTEST', 'Fatal error', error);
    console.error('\n❌ Backtest failed:', error.message);
    process.exit(1);
  }
}

// Fehlerbehandlung
process.on('unhandledRejection', (reason, promise) => {
  logger.error('SYSTEM', 'Unhandled Rejection', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('SYSTEM', 'Uncaught Exception', error);
  process.exit(1);
});

// Starte Backtest
main();
