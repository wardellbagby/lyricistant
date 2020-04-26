import { IpcListenable } from 'common/Ipc';
import { ipcMain as electronMain } from 'electron';
export const ipcMain: IpcListenable = electronMain;
