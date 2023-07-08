import { fileOpen, fileSave } from 'browser-fs-access';

export interface FileSystem {
  openFile: typeof fileOpen;
  saveFile: typeof fileSave;
}

export class DOMFileSystem implements FileSystem {
  public openFile = fileOpen;
  public saveFile = fileSave;
}
