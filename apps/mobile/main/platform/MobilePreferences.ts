import { DetailPaneVisibility } from '@lyricistant/common/preferences/PreferencesData';
import { DOMPreferences } from '@lyricistant/core-dom-platform/platform/DOMPreferences';

export class MobilePreferences extends DOMPreferences {
  public getDefaultPreferences = async () => ({
    detailPaneVisibility: DetailPaneVisibility.Toggleable,
  });
}
