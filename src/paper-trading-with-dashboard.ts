/**
 * Paper Trading Entry Point with Live Dashboard
 * Startet Paper Trading MIT Live-Dashboard
 */

import { ConfigLoader } from './config/config-loader';
import { PaperTradingEngine } from './live/paper-trading-engine';
import { DashboardServer } from './server/dashboard-server';
import { logger } from './utils/logger';

async function main() {
  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   AI DEEPSEEK TRADER - PAPER TRADING WITH LIVE DASHBOARD      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Lade Konfiguration
    const config = ConfigLoader.loadConfig();
    ConfigLoader.validateConfig(config);
    ConfigLoader.printConfig(config);

    // 2. Starte Dashboard Server
    const dashboardPort = parseInt(process.env.DASHBOARD_PORT || '3000');
    const dashboard = new DashboardServer(dashboardPort);
    await dashboard.start();

    console.log(`\n📊 Dashboard server started: http://localhost:${dashboardPort}`);
    console.log(`\n🌐 Open your browser: http://localhost:${dashboardPort}\n`);

    // 3. Erstelle Paper Trading Engine mit Dashboard
    const engine = new PaperTradingEngine(config, dashboard);

    // 4. Starte Paper Trading
    await engine.start();

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n\n⚠️  Stopping Paper Trading and Dashboard...\n');
      engine.stop();
      dashboard.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error: any) {
    logger.error('PAPER_TRADING', 'Fatal error', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Fehlerbehandlung
process.on('unhandledRejection', (reason, promise) => {
  logger.error('SYSTEM', 'Unhandled Rejection', { reason, promise });
  console.error('\n❌ Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('SYSTEM', 'Uncaught Exception', error);
  console.error('\n❌ Uncaught Exception:', error);
  process.exit(1);
});

// Starte Main
main();
