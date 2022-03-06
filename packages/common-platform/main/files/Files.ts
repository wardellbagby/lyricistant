import {
  FileMetadata,
  PlatformFile,
} from '@lyricistant/common/files/PlatformFile';

export interface ExtensionData extends Record<string, string> {
  history?: string;
}

export interface FileData {
  /** The data contained with this file. **/
  lyrics: string;
  extensions?: Partial<ExtensionData>;
}

export const LYRICS_MIME_TYPE = 'application/zip';
export const LYRICS_EXTENSION = '.lyrics';
export const SUPPORTED_MIME_TYPES = ['text/plain', LYRICS_MIME_TYPE];
export const SUPPORTED_EXTENSIONS = ['.txt', LYRICS_EXTENSION];

export interface Files {
  openFile: (file?: PlatformFile) => Promise<PlatformFile>;
  saveFile: (
    data: ArrayBuffer,
    defaultFileName: string,
    path?: string
  ) => Promise<FileMetadata>;
  readFile?: (filePath: string) => Promise<PlatformFile>;
}
