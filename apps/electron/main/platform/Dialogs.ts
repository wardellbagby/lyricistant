import { Dialogs as IDialogs } from '@common/dialogs/Dialogs';
import { dialog } from 'electron';
import { mainWindow } from '../index';

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
