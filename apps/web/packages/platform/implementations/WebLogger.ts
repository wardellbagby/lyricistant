import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';
import { Clock } from '@lyricistant/common-platform/time/Clock';
import { renderer } from '@web-platform/renderer';
import { sprintf } from 'sprintf-js';

const logFormatTemplate = '[%(date)s] [%(level)s] %(text)s';

export class WebLogger implements PlatformLogger {
  private messages: string[] = [];

  public constructor(private clock: Clock) {}

  public debug = (message: string, ...args: unknown[]): void => {
    console.debug(message, ...args);
    this.messages.push(this.formatMessage('debug', message, ...args));
    this.maybeAddToCache();
  };

  public error = (message: string, ...args: unknown[]): void => {
    console.error(message, ...args);
    this.messages.push(this.formatMessage('error', message, ...args));
    this.maybeAddToCache();
  };

  public info = (message: string, ...args: unknown[]): void => {
    console.info(message, ...args);
    this.messages.push(this.formatMessage('info', message, ...args));
    this.maybeAddToCache();
  };

  public verbose = (message: string, ...args: unknown[]): void => {
    console.debug(message, ...args);
    this.messages.push(this.formatMessage('verbose', message, ...args));
    this.maybeAddToCache();
  };

  public warn = (message: string, ...args: unknown[]): void => {
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

  private maybeAddToCache = async (force = false) => {
    if (force || this.messages.length > 25) {
      const logs = await this.getAllLogs();
      logs.push(...this.messages);
      this.messages = [];
      const storage = await renderer.getSessionStorage();
      return await storage.setItem('logs', JSON.stringify(logs));
    }
  };

  private formatMessage = (
    level: string,
    message: string,
    ...args: unknown[]
  ) => {
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
