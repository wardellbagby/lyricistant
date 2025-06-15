import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';
import { DateTime } from 'luxon';
import { Subject } from 'rxjs';
import { bufferCount, map } from 'rxjs/operators';
import { sprintf } from 'sprintf-js';

// TODO Stop storing log messages in global state like this and migrate to Clock.
export class DOMLogger implements PlatformLogger {
  public debug(message: string, ...args: unknown[]): void {
    console.debug(message, ...args);
    logMessages.next(['debug', message, args]);
  }

  public error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
    logMessages.next(['error', message, args]);
  }

  public verbose(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
    logMessages.next(['verbose', message, args]);
  }

  public warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
    logMessages.next(['warn', message, args]);
  }

  public info(message: string, ...args: unknown[]): void {
    console.info(message, ...args);
    logMessages.next(['info', message, args]);
  }

  public async getPrintedLogs() {
    logMessages.complete();
    const logs = getLogs();
    logMessages = new Subject();
    return logs;
  }
}

let logMessages = new Subject<[string, string, unknown[]]>();
logMessages
  .pipe(
    map((messageParts) => toDownloadableLogMessage(...messageParts)),
    bufferCount(25),
  )
  .subscribe((messages) => {
    logToSessionStorage(messages);
  });

const logFormatTemplate = '[%(date)s] [%(level)s] %(text)s\n';
const format = 'yyyy-MM-dd hh:mm.u';
const toDownloadableLogMessage = (
  level: string,
  message: string,
  ...args: unknown[]
) => {
  const date = DateTime.local().toFormat(format);
  const text = `${message} ${args.map((arg) => JSON.stringify(arg)).join(' ')}`;
  return sprintf(logFormatTemplate, {
    date,
    level,
    text,
  });
};
const getLogs = (): string[] =>
  JSON.parse(sessionStorage.getItem('logs') ?? '[]');

const logToSessionStorage = (messages: string[]) => {
  const currentLogs: string[] = getLogs();
  currentLogs.push(...messages);
  sessionStorage.setItem('logs', JSON.stringify(currentLogs));
};
