import { Manager } from '@lyricistant/common/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { SplashScreen } from '@capacitor/splash-screen';
import { Logger } from '@lyricistant/common/Logger';

export class SplashScreenManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private logger: Logger
  ) {}

  public register(): void {
    this.rendererDelegate.on('ready-for-events', () => {
      SplashScreen.hide({
        fadeOutDuration: 1000,
      }).catch(() => this.logger.warn('Failed to hide the splash screen.'));
    });
  }
}
