import {
  DroppableFile,
  FileMetadata,
  Files,
  PlatformFile,
} from '@lyricistant/common/files/Files';
import { renderer } from '@web-platform/renderer';
import { transfer } from 'comlink';

export class WebFiles implements Files {
  public openFile = async (file?: DroppableFile): Promise<PlatformFile> => {
    if (file) {
      return {
        data: file.data,
        type: file.type,
        metadata: {
          path: file.path,
        },
      };
    }
    const { path, data } = await (await renderer.getFileSystem()).openFile();
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
    ).saveFile(transfer(data, [data]), path);
    return {
      path: savedPath,
    };
  };
}
