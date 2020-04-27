import { IpcListenable, IpcSendable } from 'common/Ipc';
import {
  ipcMain as electronMain,
  ipcRenderer as electronRenderer
} from 'electron';
export const ipcMain: IpcListenable = electronMain;
export const ipcRenderer: IpcSendable = electronRenderer;
