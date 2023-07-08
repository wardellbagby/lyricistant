import { Keyboard } from '@capacitor/keyboard';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { DetailPaneVisibility } from '@lyricistant/common/preferences/PreferencesData';
import { Manager } from '@lyricistant/common-platform/Manager';
import {
  getPreferencesDataOrDefault,
  Preferences,
} from '@lyricistant/common-platform/preferences/Preferences';

export class SoftKeyboardManager implements Manager {
  private isSmallLayout = false;

  public constructor(
    private rendererDelegate: RendererDelegate,
    private preferences: Preferences
  ) {}

  public register(): void {
    this.rendererDelegate.on('layout-changed', (isSmallLayout) => {
      this.isSmallLayout = isSmallLayout;
    });

    Keyboard.addListener('keyboardWillShow', async () => {
      if (await this.isDetailPaneToggleable()) {
        this.rendererDelegate.send('close-detail-pane');
      }
    });

    Keyboard.addListener('keyboardWillHide', async () => {
      if (await this.isDetailPaneToggleable()) {
        this.rendererDelegate.send('show-detail-pane');
      }
    });
  }

  private isDetailPaneToggleable = async () => {
    const preferenceData = await getPreferencesDataOrDefault(this.preferences);

    return (
      this.isSmallLayout &&
      preferenceData &&
      preferenceData.detailPaneVisibility === DetailPaneVisibility.Toggleable
    );
  };
}
