export interface Buffers {
  bufferToString: (buffer: ArrayBuffer) => string;
  stringToBuffer: (input: string) => ArrayBuffer;
}
