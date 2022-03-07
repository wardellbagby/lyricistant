import { App } from '@capacitor/app';
import { Manager } from '@lyricistant/common-platform/Manager';

export class BackButtonManager implements Manager {
  public register = (): void => {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  };
}
