import { Logger } from '@lyricistant/common/Logger';
import { Remote } from 'comlink';

export interface Platform {
  receive: (channel: string, args: any[]) => void;
  getLogger: () => Promise<Remote<Logger>>;
  onRendererListenerSet: (channel: string) => void;
  start: () => Promise<void>;
}
