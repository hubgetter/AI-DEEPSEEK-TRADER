/**
 * Paper Trading Entry Point
 * Startet Paper Trading ohne Dashboard
 */

import { ConfigLoader } from './config/config-loader';
import { PaperTradingEngine } from './live/paper-trading-engine';
import { logger } from './utils/logger';

async function main() {
  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║      AI DEEPSEEK TRADER - PAPER TRADING (LIVE SIMULATION)     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Lade Konfiguration
    const config = ConfigLoader.loadConfig();
    ConfigLoader.validateConfig(config);
    ConfigLoader.printConfig(config);

    // 2. Erstelle Paper Trading Engine
    const engine = new PaperTradingEngine(config);

    // 3. Starte Paper Trading
    await engine.start();

    // Graceful Shutdown
    process.on('SIGINT', () => {
      console.log('\n\n⚠️  Stopping Paper Trading...\n');
      engine.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n⚠️  Stopping Paper Trading...\n');
      engine.stop();
      process.exit(0);
    });
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
