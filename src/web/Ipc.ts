import { IpcSendable } from 'common/Ipc';
import { IpcChannels } from 'common/ipc-channels';
class RealWeb implements IpcSendable {
  public send(channel: IpcChannels, ...args: any[]): void {}
  public on(
    channel: IpcChannels,
    listener: (event: Event, ...args: any[]) => void
  ): this {
    if (channel === 'dark-mode-toggled') {
      listener(null, null, true);
    }
    return this;
  }
  public removeAllListeners(channel: IpcChannels): this {
    return this;
  }
  public removeListener(
    channel: IpcChannels,
    listener: (...args: any[]) => void
  ): this {
    return this;
  }
}

export const ipcRenderer = new RealWeb();
