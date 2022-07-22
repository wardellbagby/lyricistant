/* eslint-disable no-console */
import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';
import { Clock } from '@lyricistant/common-platform/time/Clock';
import { renderer } from '@web-platform/renderer';
import { sprintf } from 'sprintf-js';

const logFormatTemplate = '[%(date)s] [%(level)s] %(text)s';

export class WebLogger implements PlatformLogger {
  private messages: string[] = [];

  public constructor(private clock: Clock) {}

  public debug = (message: string, ...args: any[]): void => {
    console.debug(message, ...args);
    this.messages.push(this.formatMessage('debug', message, ...args));
    this.maybeAddToCache();
  };

  public error = (message: string, ...args: any[]): void => {
    console.error(message, ...args);
    this.messages.push(this.formatMessage('error', message, ...args));
    this.maybeAddToCache();
  };

  public info = (message: string, ...args: any[]): void => {
    console.info(message, ...args);
    this.messages.push(this.formatMessage('info', message, ...args));
    this.maybeAddToCache();
  };

  public verbose = (message: string, ...args: any[]): void => {
    console.debug(message, ...args);
    this.messages.push(this.formatMessage('verbose', message, ...args));
    this.maybeAddToCache();
  };

  public warn = (message: string, ...args: any[]): void => {
    console.warn(message, ...args);
    this.messages.push(this.formatMessage('warn', message, ...args));
    this.maybeAddToCache();
  };

  public getPrintedLogs = (): Promise<string[]> =>
    this.flush().then(() => this.getAllLogs());

  public flush = () => this.maybeAddToCache(true);

  private getAllLogs = (): Promise<string[]> =>
    renderer
      .getSessionStorage()
      .then(async (storage) => JSON.parse(await storage.getItem('logs')) ?? []);

  private maybeAddToCache = (force = false) => {
    if (force || this.messages.length > 25) {
      return this.getAllLogs().then(async (logs) => {
        logs.push(...this.messages);
        this.messages = [];
        return renderer
          .getSessionStorage()
          .then((storage) => storage.setItem('logs', JSON.stringify(logs)));
      });
    }
    return Promise.resolve();
  };

  private formatMessage = (level: string, message: string, ...args: any[]) => {
    const date = this.clock.now().formatIso();
    const text = `${message} ${args
      .map((arg) => JSON.stringify(arg))
      .join(' ')}`;
    return sprintf(logFormatTemplate, {
      date,
      level,
      text,
    });
  };
}
