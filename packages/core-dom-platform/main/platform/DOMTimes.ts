import { Times } from '@lyricistant/common-platform/time/Times';

export class DOMTimes implements Times {
  public elapsed = (): number => performance.now();
}
