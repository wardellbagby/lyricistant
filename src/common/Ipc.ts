import { IpcChannels } from './ipc-channels';

export interface IpcListenable {
  on(
    channel: IpcChannels,
    listener: (event: Event, ...args: any[]) => void
  ): this;

  removeAllListeners(channel: IpcChannels): this;
  removeListener(
    channel: IpcChannels,
    listener: (...args: any[]) => void
  ): this;
}

export interface IpcSendable extends IpcListenable {
  send(channel: IpcChannels, ...args: any[]): void;
}

export let browserIpc: IpcSendable;

if (process.versions.hasOwnProperty('electron')) {
  const electronRenderer: IpcSendable = (await import('electron')).ipcRenderer;
  browserIpc = electronRenderer;
} else {
  const web: IpcSendable = (await import('../web/Web')).Web;
  browserIpc = web;
}
