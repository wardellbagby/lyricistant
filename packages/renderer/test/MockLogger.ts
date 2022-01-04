import { Logger } from '@lyricistant/common/Logger';

export class MockLogger implements Logger {
  public debug = (): void => undefined;
  public error = (): void => undefined;
  public info = (): void => undefined;
  public verbose = (): void => undefined;
  public warn = (): void => undefined;
  public save = (): Promise<void> => Promise.resolve(undefined);
}
