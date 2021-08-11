import { Dialogs as IDialogs } from '@lyricistant/common/dialogs/Dialogs';
import { dialog } from 'electron';
import { mainWindow } from '@electron-app/index';

export class ElectronDialogs implements IDialogs {
  public showDialog = async (message: string) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      message,
      buttons: ['Yes', 'No'],
    });

    return result.response ? 'no' : 'yes';
  };
}
