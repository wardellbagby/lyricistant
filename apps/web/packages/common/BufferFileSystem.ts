import { FileSystemHandle } from 'browser-fs-access';

export interface BufferFileSystem {
  saveFile: (
    buffer: ArrayBuffer,
    defaultFileName: string,
    handle?: FileSystemHandle
  ) => Promise<{ path: string }>;
  openFile: () => Promise<{
    path: string;
    data: ArrayBuffer;
    handle?: FileSystemHandle;
  }>;
}
