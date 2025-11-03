/**
 * Backtest with Live Dashboard
 * Führt Backtest durch und zeigt Ergebnisse live im Browser an
 */

import { ConfigLoader } from './config/config-loader';
import { BacktestEngine } from './backtesting/backtest-engine';
import { DashboardServer } from './server/dashboard-server';
import { logger } from './utils/logger';
import * as path from 'path';

async function main() {
  let dashboardServer: DashboardServer | null = null;

  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║    AI DEEPSEEK TRADER - BACKTESTING WITH LIVE DASHBOARD        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Lade Konfiguration
    const config = ConfigLoader.loadConfig();
    ConfigLoader.validateConfig(config);
    ConfigLoader.printConfig(config);

    // 2. Starte Dashboard Server
    const port = process.env.DASHBOARD_PORT ? parseInt(process.env.DASHBOARD_PORT) : 3000;
    dashboardServer = new DashboardServer(port);
    await dashboardServer.start();

    console.log(`\n🌐 Open your browser: http://localhost:${port}\n`);
    console.log('Press Ctrl+C to stop the backtest and server\n');

    // 3. Erstelle Backtest Engine
    const engine = new BacktestEngine(config);

    // 4. Verbinde Performance Tracker mit Dashboard
    const performanceTracker = (engine as any).performanceTracker;
    if (performanceTracker) {
      performanceTracker.connectToDashboard(dashboardServer);
    }

    // 5. Starte Backtest
    logger.info('BACKTEST', '🚀 Starting backtest with live dashboard...');
    const result = await engine.run();

    console.log('\n✅ Backtest completed!');
    console.log(`📊 Total Trades: ${result.stats.totalTrades}`);
    console.log(`💰 Total P&L: $${result.stats.totalPnL.toFixed(2)} (${result.stats.totalPnLPercentage.toFixed(2)}%)`);
    console.log(`📈 Win Rate: ${result.stats.winRate.toFixed(1)}%`);
    console.log(`\n🌐 Dashboard still running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop the server\n');

    // 6. Halte Server am Laufen
    await keepServerRunning();

  } catch (error: any) {
    logger.error('BACKTEST', 'Fatal error', error);
    console.error('\n❌ Backtest failed:', error.message);

    if (dashboardServer) {
      await dashboardServer.stop();
    }

    process.exit(1);
  }
}

/**
 * Hält den Server am Laufen bis Ctrl+C gedrückt wird
 */
function keepServerRunning(): Promise<void> {
  return new Promise((resolve) => {
    process.on('SIGINT', () => {
      console.log('\n\n📊 Shutting down dashboard server...');
      resolve();
    });

    process.on('SIGTERM', () => {
      console.log('\n\n📊 Shutting down dashboard server...');
      resolve();
    });
  });
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

// Starte Backtest mit Dashboard
main().then(() => {
  console.log('\n👋 Server stopped. Goodbye!\n');
  process.exit(0);
});
