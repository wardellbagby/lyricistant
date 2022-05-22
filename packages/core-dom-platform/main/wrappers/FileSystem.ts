import { fileOpen, fileSave, FileSystemHandle } from 'browser-fs-access';

// Remove this when Typescript types start including the queryPermission and
// requestPermission properties.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface FileSystemFileHandle extends FileSystemHandle {}
}
export interface FileSystem {
  openFile: typeof fileOpen;
  saveFile: typeof fileSave;
}

export class DOMFileSystem implements FileSystem {
  public openFile = fileOpen;
  public saveFile = fileSave;
}
