import { Manager } from '@lyricistant/common-platform/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { TemporaryFiles } from '@lyricistant/common-platform/files/TemporaryFiles';
import { isUnderTest } from '@lyricistant/common/BuildModes';

export class FirstLaunchManager implements Manager {
  private static readonly IS_FIRST_LAUNCH_KEY = 'is-first-launch';
  public constructor(
    private rendererDelegate: RendererDelegate,
    private temporaryFiles: TemporaryFiles
  ) {}

  public register = () => {
    this.rendererDelegate.on('ready-for-events', this.onReadyForEvents);
  };

  private onReadyForEvents = async () => {
    const isFirstLaunch = !(await this.temporaryFiles.exists(
      FirstLaunchManager.IS_FIRST_LAUNCH_KEY
    ));
    if (isFirstLaunch && !isUnderTest) {
      this.rendererDelegate.send('open-about');
    }

    this.temporaryFiles.set(
      FirstLaunchManager.IS_FIRST_LAUNCH_KEY,
      JSON.stringify(false)
    );
  };
}
