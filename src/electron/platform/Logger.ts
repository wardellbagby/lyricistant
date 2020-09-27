import log from 'electron-log';

export class ElectronLogger implements Logger {
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
}
