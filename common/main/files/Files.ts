export class FileData {
  public filePath?: string;
  public data: string;

  public constructor(fileName: string | undefined, data: string) {
    this.filePath = fileName;
    this.data = data;
  }
}

export interface DroppableFile {
  path: string;
  type: string;
  data: ArrayBuffer;
}

export interface Files {
  openFile: (file?: DroppableFile) => Promise<FileData | void>;
  saveFile: (file: FileData) => Promise<string | void>;
  readFile?: (filePath: string) => Promise<FileData>;
}
