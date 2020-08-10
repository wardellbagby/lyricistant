export class FileData {
  public filePath: string;
  public data: string;

  constructor(fileName: string, data: string) {
    this.filePath = fileName;
    this.data = data;
  }
}

export interface Files {
  openFile: () => Promise<FileData | void>;
  saveFile: (file: FileData) => Promise<string | void>;
  readFile?: (filePath: string) => Promise<FileData>;
}
