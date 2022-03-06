import { PlatformFile } from '@lyricistant/common/files/PlatformFile';
import { FileSystemHandle } from 'browser-fs-access';

type FSApiDataTransferItem = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<FileSystemHandle>;
};
type FileWithPath = File & { path?: string };
export const toPlatformFile = async (
  data: FSApiDataTransferItem | File
): Promise<PlatformFile> => {
  const file: FileWithPath = data instanceof File ? data : data.getAsFile();
  const handle =
    data instanceof File ? undefined : await data.getAsFileSystemHandle?.();
  return {
    metadata: {
      path: file.path ?? file.name,
      name: file.name,
    },
    type: file.type ?? '',
    data: await file.arrayBuffer(),
    extras: { handle },
  };
};
