import { FileSystemHandle } from 'browser-fs-access';

export interface BufferFileSystem {
  saveFile: (
    buffer: ArrayBuffer,
    defaultFileName: string,
    handle?: FileSystemHandle
  ) => Promise<{ handle?: FileSystemHandle; cancelled: boolean }>;
  openFile: () => Promise<{
    path: string;
    data: ArrayBuffer;
    handle?: FileSystemHandle;
  }>;
}
