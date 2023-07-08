import { PlatformFile } from '@lyricistant/common/files/PlatformFile';
import { Buffers } from '@lyricistant/common-platform/files/Buffers';
import { FileData } from '@lyricistant/common-platform/files/Files';
import { FileHandler } from '@lyricistant/common-platform/files/handlers/FileHandler';

export class TextFileHandler implements FileHandler {
  public extension = 'txt';

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
