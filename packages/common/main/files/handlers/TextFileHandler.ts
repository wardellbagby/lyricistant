import { FileHandler } from '@lyricistant/common/files/handlers/FileHandler';
import { FileData, PlatformFile } from '@lyricistant/common/files/Files';
import { Buffers } from '@lyricistant/common/files/Buffers';

export class TextFileHandler implements FileHandler {
  public constructor(private buffers: Buffers) {}

  public canHandle = (file: PlatformFile): boolean =>
    file?.type === 'text/plain' ||
    file.metadata.name?.endsWith('txt') ||
    file.metadata.path.endsWith('txt');

  public create = async (file: FileData): Promise<ArrayBuffer> =>
    this.buffers.stringToBuffer(file.lyrics);

  public load = async (file: PlatformFile): Promise<FileData> => ({
    lyrics: this.buffers.bufferToString(file.data),
  });
}