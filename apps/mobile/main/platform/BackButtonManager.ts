import { Manager } from '@lyricistant/common/Manager';
import { App } from '@capacitor/app';

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
