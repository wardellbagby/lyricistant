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
