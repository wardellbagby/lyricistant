import { PlatformFile } from '@lyricistant/common/files/PlatformFile';

/**
 * Represents a {@link DataTransferItem} with an optional getAsFileSystemHandle
 * method that will return a FileSystemHandle.
 *
 * That method is not yet generally available, and Typescript's DOM types do not
 * have support for it yet.
 *
 * https://caniuse.com/mdn-api_datatransferitem_getasfilesystemhandle
 */
type FSApiDataTransferItem = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<FileSystemFileHandle>;
};
/**
 * A file that, optionally, includes a path.
 *
 * Electron uses this to send files with a path parameter, but no other browser
 * does, so we mark it as optional.
 */
type FileWithPath = File & { path?: string };

/**
 * Convert a {@link File} or a {@link DataTransferItem} to a {@link PlatformFile}
 * that can be sent to the platform.
 *
 * @param data The File or DataTransferItem to convert.
 */
export const toPlatformFile = async (
  data: FSApiDataTransferItem | FileWithPath
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
