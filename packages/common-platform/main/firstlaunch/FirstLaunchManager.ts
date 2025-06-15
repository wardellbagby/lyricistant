import { isUnderTest } from '@lyricistant/common/BuildModes';
import { RendererDelegate, RendererInfo } from '@lyricistant/common/Delegates';
import { AppData } from '@lyricistant/common-platform/appdata/AppData';
import { Manager } from '@lyricistant/common-platform/Manager';

export class FirstLaunchManager implements Manager {
  private static readonly IS_FIRST_LAUNCH_KEY = 'is-first-launch';
  public constructor(
    private rendererDelegate: RendererDelegate,
    private appData: AppData,
  ) {}

  public register = () => {
    this.rendererDelegate.on('ready-for-events', this.onReadyForEvents);
  };

  private onReadyForEvents = async (info: RendererInfo) => {
    if (info.isDeepLink) {
      return;
    }

    const isFirstLaunch = !(await this.appData.exists(
      FirstLaunchManager.IS_FIRST_LAUNCH_KEY,
    ));
    if (isFirstLaunch && !isUnderTest) {
      this.rendererDelegate.send('open-about');
    }

    this.appData.set(FirstLaunchManager.IS_FIRST_LAUNCH_KEY, false);
  };
}
