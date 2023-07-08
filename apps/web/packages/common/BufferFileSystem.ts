export interface BufferFileSystem {
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
