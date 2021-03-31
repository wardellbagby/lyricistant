export class FileData implements FileMetadata {
  public filePath?: string;
  public name?: string;
  public data: string;

  public constructor(
    name: string | undefined,
    path: string | undefined,
    data: string
  ) {
    this.filePath = path;
    this.data = data;
    this.name = name;
  }
}

export interface FileMetadata {
  filePath?: string;
  name?: string;
}

export interface DroppableFile {
  path: string;
  type: string;
  data: ArrayBuffer;
}

export interface Files {
  openFile: (file?: DroppableFile) => Promise<FileData | void>;
  saveFile: (file: FileData) => Promise<FileMetadata | void>;
  readFile?: (filePath: string) => Promise<FileData>;
}
