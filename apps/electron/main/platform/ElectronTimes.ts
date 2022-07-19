import { performance } from 'perf_hooks';
import { Times } from '@lyricistant/common-platform/time/Times';

export class ElectronTimes implements Times {
  public elapsed = (): number => performance.now();
}
