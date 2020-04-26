import { IpcSendable } from 'common/Ipc';
import { IpcChannels } from 'common/ipc-channels';
class RealWeb implements IpcSendable {
  public send(channel: IpcChannels, ...args: any[]): void {
    throw new Error('Method not implemented.');
  }
  public on(
    channel: IpcChannels,
    listener: (event: Event, ...args: any[]) => void
  ): this {
    throw new Error('Method not implemented.');
  }
  public removeAllListeners(channel: IpcChannels): this {
    throw new Error('Method not implemented.');
  }
  public removeListener(
    channel: IpcChannels,
    listener: (...args: any[]) => void
  ): this {
    throw new Error('Method not implemented.');
  }
}

export const Web = new RealWeb();
