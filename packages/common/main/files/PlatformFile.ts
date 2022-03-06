import { FileSystemHandle } from 'browser-fs-access';

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

export interface PlatformFile {
  metadata: FileMetadata;
  data: ArrayBuffer;
  type?: string;
  extras?: {
    handle?: FileSystemHandle;
  };
}
