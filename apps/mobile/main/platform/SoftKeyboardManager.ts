import { Keyboard } from '@capacitor/keyboard';
import { Manager } from '@lyricistant/common-platform/Manager';
import {
  getPreferencesDataOrDefault,
  Preferences,
} from '@lyricistant/common-platform/preferences/Preferences';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { DetailPaneVisibility } from '@lyricistant/common/preferences/PreferencesData';

export class SoftKeyboardManager implements Manager {
  public constructor(
    private rendererDelegate: RendererDelegate,
    private preferences: Preferences
  ) {}

  public register(): void {
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
      preferenceData &&
      preferenceData.detailPaneVisibility === DetailPaneVisibility.Toggleable
    );
  };
}