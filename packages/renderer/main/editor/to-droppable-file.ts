import { DroppableFile } from '@lyricistant/common/files/Files';
import { FileSystemHandle } from 'browser-fs-access';

type FSApiDataTransferItem = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<FileSystemHandle>;
};
type FileWithPath = File & { path?: string };
export const toDroppableFile = async (
  data: FSApiDataTransferItem | File
): Promise<DroppableFile> => {
  const file: FileWithPath = data instanceof File ? data : data.getAsFile();
  const handle =
    data instanceof File ? undefined : await data.getAsFileSystemHandle?.();
  return {
    path: file.path ?? file.name,
    type: file.type,
    data: await file.arrayBuffer(),
    handle,
  };
};
