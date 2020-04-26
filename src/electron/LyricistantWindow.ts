import { IpcChannels } from 'common/ipc-channels';
import { BrowserWindow, WebContents } from 'electron';

interface LyricistantWebContents extends WebContents {
  send(channel: IpcChannels, ...args: any[]): void;
}
export interface LyricistantWindow extends BrowserWindow {
  webContents: LyricistantWebContents;
}
