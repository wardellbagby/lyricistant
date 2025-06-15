import { Logger } from '@lyricistant/common/Logger';
import { Remote } from 'comlink';

export interface Platform {
  receive: (channel: string, args: unknown[]) => void;
  getLogger: () => Promise<Remote<Logger>>;
  onRendererListenerSet: (channel: string) => void;
  start: () => Promise<void>;
}
