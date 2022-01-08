import {
  FileMetadata,
  Files,
  PlatformFile,
} from '@lyricistant/common/files/Files';
import { renderer } from '@web-platform/renderer';
import { transfer } from 'comlink';
import { FileSystemHandle } from 'browser-fs-access';

export class WebFiles implements Files {
  private handles: Map<string, FileSystemHandle> = new Map<
    string,
    FileSystemHandle
  >();
  public openFile = async (file?: PlatformFile): Promise<PlatformFile> => {
    if (file) {
      this.handles.set(file.metadata.path, file.extras.handle);
      return file;
    }
    const { path, data, handle } = await (
      await renderer.getFileSystem()
    ).openFile();
    this.handles.set(path, handle);
    return {
      data,
      type: '',
      metadata: {
        path,
      },
    };
  };

  public saveFile = async (
    data: ArrayBuffer,
    path?: string
  ): Promise<FileMetadata> => {
    const { path: savedPath } = await (
      await renderer.getFileSystem()
    ).saveFile(transfer(data, [data]), path, this.handles.get(path));
    return {
      path: savedPath,
    };
  };
}
