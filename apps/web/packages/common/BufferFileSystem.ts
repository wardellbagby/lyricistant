export interface BufferFileSystem {
  areHandlesSupported: () => Promise<boolean>;
  saveFile: (
    buffer: ArrayBuffer,
    defaultFileName: string,
    handle?: FileSystemFileHandle
  ) => Promise<{ handle?: FileSystemFileHandle; cancelled: boolean }>;
  openFile: () => Promise<{
    path: string;
    data: ArrayBuffer;
    handle?: FileSystemFileHandle;
  }>;
}
