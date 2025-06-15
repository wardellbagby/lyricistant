import {
  FileMetadata,
  PlatformFile,
} from '@lyricistant/common/files/PlatformFile';
import { Files } from '@lyricistant/common-platform/files/Files';
import { renderer } from '@web-platform/renderer';

export class WebFiles implements Files {
  private handles = new Map<string, FileSystemFileHandle>();

  public supportsChoosingFileName = async () =>
    (await renderer.getFileSystem()).areHandlesSupported();

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
        path: handle ? path : undefined,
      },
    };
  };

  public saveFile = async (
    data: ArrayBuffer,
    defaultFileName: string,
    path?: string,
  ): Promise<FileMetadata> => {
    const { handle, cancelled } = await (
      await renderer.getFileSystem()
    ).saveFile(data, defaultFileName, this.handles.get(path));

    if (cancelled) {
      return null;
    }

    const returnedPath = handle?.name;
    if (handle) {
      this.handles.set(returnedPath, handle);
    }
    return {
      path: returnedPath,
    };
  };
}
