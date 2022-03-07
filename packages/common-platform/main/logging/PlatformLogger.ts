import { Logger } from '@lyricistant/common/Logger';

export interface PlatformLogger extends Logger {
  flush?: () => void;
  getPrintedLogs: () => Promise<string[]>;
}
