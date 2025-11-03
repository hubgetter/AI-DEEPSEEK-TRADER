/**
 * Report Opener Utility
 * Opens performance reports in default browser
 */

import { exec } from 'child_process';
import * as path from 'path';
import { logger } from './logger';

export class ReportOpener {
  /**
   * Öffnet eine HTML-Datei im Standard-Browser
   */
  static async openInBrowser(filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath);

    try {
      let command: string;

      // Plattform-spezifische Befehle
      if (process.platform === 'win32') {
        // Windows
        command = `start "" "${absolutePath}"`;
      } else if (process.platform === 'darwin') {
        // macOS
        command = `open "${absolutePath}"`;
      } else {
        // Linux
        command = `xdg-open "${absolutePath}"`;
      }

      exec(command, (error) => {
        if (error) {
          logger.error('REPORT', `Failed to open report in browser: ${error.message}`);
          logger.info('REPORT', `Please open manually: ${absolutePath}`);
        } else {
          logger.info('REPORT', `Performance report opened in browser: ${absolutePath}`);
        }
      });
    } catch (error) {
      logger.error('REPORT', 'Failed to open report', error);
      logger.info('REPORT', `Please open manually: ${absolutePath}`);
    }
  }

  /**
   * Erstellt und öffnet einen Report
   */
  static async createAndOpen(
    htmlContent: string,
    outputPath: string
  ): Promise<string> {
    const fs = await import('fs');
    const dir = path.dirname(outputPath);

    // Erstelle Verzeichnis falls nicht vorhanden
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Schreibe Datei
    fs.writeFileSync(outputPath, htmlContent, 'utf-8');

    // Öffne im Browser
    await this.openInBrowser(outputPath);

    return outputPath;
  }
}
