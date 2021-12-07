import { DroppableFile } from '@lyricistant/common/files/Files';
import { FileSystemHandle } from 'browser-fs-access';

export const toDroppableFile = async (
  data: DataTransferItem & {
    getAsFileSystemHandle?: () => Promise<FileSystemHandle>;
  }
): Promise<DroppableFile> => {
  const file: File & { path?: string } = data.getAsFile();
  const handle = await data.getAsFileSystemHandle?.();
  return {
    path: file.path ?? file.name,
    type: file.type,
    data: await file.arrayBuffer(),
    handle,
  };
};
