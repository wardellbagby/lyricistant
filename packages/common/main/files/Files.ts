import { FileSystemHandle } from 'browser-fs-access';

export interface ExtensionData extends Record<string, string> {
  history?: string;
}

export interface FileData {
  /** The data contained with this file. **/
  lyrics: string;
  extensions?: Partial<ExtensionData>;
}

export interface FileMetadata {
  /**
   * A unique way of identifying a file, dependent on the platform in question. For instance, against a Desktop
   * platform, we would expect this to be a file path, such as "/Desktop/myfile.txt". On Android, we might expect this
   * to be a content URI, such as "content://documents/1".
   */
  path: string;
  /**
   * A human displayable name that refers to this file in question. If the path can double as a human displayable name,
   * this can be omitted.
   */
  name?: string;
}

export const LYRICS_MIME_TYPE = 'application/zip';
export const LYRICS_EXTENSION = '.lyrics';
export const SUPPORTED_MIME_TYPES = ['text/plain', LYRICS_MIME_TYPE];
export const SUPPORTED_EXTENSIONS = ['.txt', LYRICS_EXTENSION];

export interface PlatformFile {
  metadata: FileMetadata;
  data: ArrayBuffer;
  type?: string;
  extras?: {
    handle?: FileSystemHandle;
  };
}

export interface Files {
  openFile: (file?: PlatformFile) => Promise<PlatformFile>;
  saveFile: (
    data: ArrayBuffer,
    defaultFileName: string,
    path?: string
  ) => Promise<FileMetadata>;
  readFile?: (filePath: string) => Promise<PlatformFile>;
}
