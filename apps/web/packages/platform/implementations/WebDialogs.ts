import { DialogResult, Dialogs } from '@lyricistant/common/dialogs/Dialogs';
import { renderer } from '@web-platform/renderer';

export class WebDialogs implements Dialogs {
  public showDialog = async (message: string): Promise<DialogResult> =>
    (await renderer.showConfirmDialog(message)) ? 'yes' : 'no';
}
