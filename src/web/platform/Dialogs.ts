import { Dialogs as IDialogs } from 'common/dialogs/Dialogs';

class WebDialogs implements IDialogs {
  public showDialog = async (message: string) => {
    const result = confirm(message);
    return result ? 'yes' : 'no';
  };
}

export type Dialogs = WebDialogs;
export const Dialogs = WebDialogs;
