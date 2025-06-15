import fs from 'fs';
import path from 'path';
import { PlatformLogger } from '@lyricistant/common-platform/logging/PlatformLogger';
import log from 'electron-log';
import { flatten } from 'lodash-es';

export class ElectronLogger implements PlatformLogger {
  public debug(message: string, ...args: unknown[]): void {
    log.debug(message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    log.error(message, ...args);
  }

  public info(message: string, ...args: unknown[]): void {
    log.info(message, ...args);
  }

  public verbose(message: string, ...args: unknown[]): void {
    log.verbose(message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    log.warn(message, ...args);
  }

  public async getPrintedLogs() {
    const logDirectory = this.getLogDirectory();

    return flatten(
      await Promise.all([
        this.readLogFile(path.resolve(logDirectory, 'main.log')),
        this.readLogFile(path.resolve(logDirectory, 'renderer.log')),
      ]),
    )
      .sort((a, b) => a.sortLine.localeCompare(b.sortLine))
      .map((msg) => msg.sortLine + '\n' + msg.rest);
  }

  public getLogDirectory = (): string =>
    path.dirname(log.transports.file.getFile().path);

  private readLogFile = async (filePath: string): Promise<LogMessage[]> => {
    const data = await fs.promises.readFile(filePath, 'utf8');

    return data
      .split('\n')
      .reduce<string[][]>(
        (chunks, line) => {
          const lastChunk = chunks[chunks.length - 1];
          if (lastChunk.length === 0 || !line.startsWith('[')) {
            lastChunk.push(line);
          } else {
            chunks.push([line]);
          }
          return chunks;
        },
        [[]],
      )
      .map<LogMessage>((chunk) => ({
        // The first line in a log message contains the time; we can sort on that
        sortLine: chunk[0],
        rest: chunk.slice(1).join('\n'),
      }));
  };
}

interface LogMessage {
  sortLine: string;
  rest: string;
}
