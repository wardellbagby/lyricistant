import { fileOpen, fileSave } from 'browser-nativefs';

export interface FileSystem {
  openFile: typeof fileOpen;
  saveFile: typeof fileSave;
}

export class MobileFileSystem implements FileSystem {
  public openFile = fileOpen;
  public saveFile = fileSave;
}
