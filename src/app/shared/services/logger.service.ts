import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  logInfo(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  logError(message: string, error?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }

  logWarn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }
}
