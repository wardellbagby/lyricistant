import { FileData, PlatformFile } from '@lyricistant/common/files/Files';

export interface FileHandler {
  canHandle: (file: PlatformFile) => boolean;
  load: (file: PlatformFile) => Promise<FileData>;
  create: (file: FileData) => Promise<ArrayBuffer>;
}

export type FileHandlers = Array<() => FileHandler>;
