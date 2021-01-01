import { Logger } from '@common/Logger';
import AdmZip from 'adm-zip';
import { BrowserWindow, dialog } from 'electron';
import log from 'electron-log';
import { parse } from 'path';

export class ElectronLogger implements Logger {
  public debug(message: string, ...args: any[]): void {
    log.debug(message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    log.error(message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    log.info(message, ...args);
  }

  public verbose(message: string, ...args: any[]): void {
    log.verbose(message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    log.warn(message, ...args);
  }

  public async save() {
    const result = await dialog.showSaveDialog(
      BrowserWindow.getFocusedWindow(),
      {
        defaultPath: 'logs',
        filters: [{ name: 'Zip Files', extensions: ['zip'] }],
      }
    );

    if (result.filePath) {
      const zip = new AdmZip();
      log.transports.file.readAllLogs().forEach(({ path, lines }) => {
        zip.addFile(parse(path).base, Buffer.from(lines.join('\n')));
      });
      await writeZip(zip, result.filePath);
    }
  }
}

const writeZip = async (zip: AdmZip, targetFileName: string) => {
  return new Promise((resolve, reject) => {
    zip.writeZip(targetFileName, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};
