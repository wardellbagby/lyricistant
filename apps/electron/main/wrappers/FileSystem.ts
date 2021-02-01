import {
  existsSync,
  promises as fspromises,
  readFileSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { isText } from 'istextorbinary';
import { app } from 'electron';

export interface FileSystem {
  writeFile: typeof fspromises.writeFile;
  readFile: typeof fspromises.readFile;
  writeFileSync: typeof writeFileSync;
  readFileSync: typeof readFileSync;
  existsSync: typeof existsSync;
  unlink: typeof fspromises.unlink;

  isText: typeof isText;
  getDataDirectory: typeof app.getPath;
  resolve: typeof path.resolve;
}

export class NodeFileSystem implements FileSystem {
  public writeFile = fspromises.writeFile;
  public readFile = fspromises.readFile;
  public writeFileSync = writeFileSync;
  public readFileSync = readFileSync;
  public existsSync = existsSync;
  public unlink = fspromises.unlink;
  public resolve = path.resolve;

  public isText = isText;
  public getDataDirectory = (...args: Parameters<typeof app.getPath>) =>
    app.getPath(...args);
}
