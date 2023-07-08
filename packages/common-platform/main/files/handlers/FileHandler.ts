import { PlatformFile } from '@lyricistant/common/files/PlatformFile';
import { FileData } from '@lyricistant/common-platform/files/Files';

export interface FileHandler {
  extension: string;

  canHandle: (file: PlatformFile) => boolean;
  load: (file: PlatformFile) => Promise<FileData>;
  create: (file: FileData) => Promise<ArrayBuffer>;
}

export type FileHandlers = FileHandler[];
