import { Dialogs as IDialogs } from '@lyricistant/common/dialogs/Dialogs';

export class CoreDialogs implements IDialogs {
  public showDialog = async (message: string) => {
    const result = confirm(message);
    return result ? 'yes' : 'no';
  };
}
