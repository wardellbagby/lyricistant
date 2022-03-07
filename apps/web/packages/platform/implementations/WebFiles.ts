import { Files } from '@lyricistant/common-platform/files/Files';
import {
  FileMetadata,
  PlatformFile,
} from '@lyricistant/common/files/PlatformFile';
import { renderer } from '@web-platform/renderer';
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
    const fs = await renderer.getFileSystem();
    const result = await fs.openFile();
    if (!result) {
      return undefined;
    }
    const { path, data, handle } = result;
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
    defaultFileName: string,
    path?: string
  ): Promise<FileMetadata> => {
    const { path: savedPath } = await (
      await renderer.getFileSystem()
    ).saveFile(data, defaultFileName, this.handles.get(path));
    return {
      path: savedPath,
    };
  };
}
