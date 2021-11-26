import { TextDecoder, TextEncoder } from 'util';
import { Buffers } from '@lyricistant/common/files/Buffers';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export class ElectronBuffers implements Buffers {
  public bufferToString = (buffer: ArrayBuffer): string =>
    decoder.decode(buffer);

  public stringToBuffer = (input: string): ArrayBuffer => encoder.encode(input);
}
