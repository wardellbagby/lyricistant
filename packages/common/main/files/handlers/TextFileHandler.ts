import { FileHandler } from '@lyricistant/common/files/handlers/FileHandler';
import { FileData, PlatformFile } from '@lyricistant/common/files/Files';
import { Buffers } from '@lyricistant/common/files/Buffers';

export class TextFileHandler implements FileHandler {
  public constructor(private buffers: Buffers) {}

  public canHandle = (): boolean => true;

  public create = async (file: FileData): Promise<ArrayBuffer> =>
    this.buffers.stringToBuffer(file.lyrics);

  public load = async (file: PlatformFile): Promise<FileData> => ({
    lyrics: this.buffers.bufferToString(file.data),
  });
}
