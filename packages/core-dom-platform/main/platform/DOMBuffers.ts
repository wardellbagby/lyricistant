import { Buffers } from '@lyricistant/common-platform/files/Buffers';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export class DOMBuffers implements Buffers {
  public bufferToString = (buffer: ArrayBuffer): string =>
    decoder.decode(buffer);

  public stringToBuffer = (input: string): ArrayBuffer => encoder.encode(input);
}
