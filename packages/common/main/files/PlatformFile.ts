import { FileSystemHandle } from 'browser-fs-access';

/** Metadata for a platform file. */
export interface FileMetadata {
  /**
   * A unique way of identifying a file, dependent on the platform in question.
   * For instance, against a Desktop platform, we would expect this to be a file
   * path, such as "/Desktop/myfile.txt". On Android, we might expect this to be
   * a content URI, such as "content://documents/1".
   */
  path: string;
  /**
   * A human displayable name that refers to this file in question. If the path
   * can double as a human displayable name, this can be omitted.
   */
  name?: string;
}

/** A representation of a file that is stored on the platform. */
export interface PlatformFile {
  /** The metadata associated with this file. */
  metadata: FileMetadata;
  /** The binary data stored in this file. */
  data: ArrayBuffer;
  /** The optional mime type of this file. */
  type?: string;
  /** Extra information that platforms might be able to use. */
  extras?: {
    /**
     * When running on Web on a browser that supports file system handles, this
     * will be the handle for a file that was dragged-and-dropped.
     */
    handle?: FileSystemHandle;
  };
}
