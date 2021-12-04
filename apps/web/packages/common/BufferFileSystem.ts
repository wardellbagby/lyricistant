export interface BufferFileSystem {
  saveFile: (buffer: ArrayBuffer, path?: string) => Promise<{ path: string }>;
  openFile: () => Promise<{ path: string; data: ArrayBuffer }>;
}
