import { dirname } from 'path';
import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';
import log from 'electron-log';

export class ElectronLogger implements PlatformLogger {
  public debug(message: string, ...args: any[]): void {
    log.debug(message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    log.error(message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    log.info(message, ...args);
  }

  public verbose(message: string, ...args: any[]): void {
    log.verbose(message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    log.warn(message, ...args);
  }

  public async getPrintedLogs() {
    const messages: string[] = [];
    log.transports.file.readAllLogs().forEach(({ lines }) => {
      messages.push(...lines);
    });

    return messages;
  }

  public getLogFolder = (): string =>
    dirname(log.transports.file.getFile().path);
}
