import {
  DroppableFile,
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
  public openFile = async (file?: DroppableFile): Promise<PlatformFile> => {
    if (file) {
      this.handles.set(file.path, file.handle);
      return {
        data: file.data,
        type: file.type,
        metadata: {
          path: file.path,
        },
      };
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
