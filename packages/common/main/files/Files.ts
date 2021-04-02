export interface FileData extends FileMetadata {
  /** The data contained with this file. **/
  data: string;
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

/**
 * A wrapper around the DOM's File object that drops any DOM type requirements and includes a path for platforms that
 * support DOM Files that have paths (i.e., Electron).
 */
export interface DroppableFile {
  path: string;
  type: string;
  data: ArrayBuffer;
}

export interface Files {
  openFile: (file?: DroppableFile) => Promise<FileData | void>;
  saveFile: (data: string, path?: string) => Promise<FileMetadata>;
  readFile?: (filePath: string) => Promise<FileData>;
}
