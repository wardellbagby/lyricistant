import { ExtensionData } from '@lyricistant/common-platform/files/Files';

export type FileDataExtensionKey = keyof ExtensionData;

/** Represents some serialized data for a file extension that has an associated version. */
export interface VersionedExtensionData<T> {
  version?: number;
  data?: T;
}

/**
 * Given some versioned extension data and an object mapping versions to
 * functions, call the appropriate version handler function.
 *
 * For instance, if your extension data can be either version 1, 2, or 3, you
 * might call this function like so:
 *
 * ```javascript
 * onVersion(
 *   extensionData,
 *   {
 *     1: () -> loadV1(extensionData.data),
 *     2: () -> loadV2(extensionData.data),
 *     3: () -> loadV3(extensionData.data),
 *     invalid: () -> setDefault()
 *   }
 * )
 * ```
 *
 * If the version of the extension data supplied does not have a handler, or if
 * the extension data does not have a version, then the invalid handler will be called.
 *
 * @param extensionData The extension data to check
 * @param handlers An object mapping versions to handler functions.
 */
export const onVersion = <R = void>(
  extensionData: VersionedExtensionData<string> | null,
  handlers: { [version: number]: () => R; invalid: () => R }
): R => {
  const version = extensionData?.version;

  if (version && version in handlers) {
    return handlers[version]();
  } else {
    return handlers.invalid();
  }
};

/** Represents an optional extension onto {@link FileData}. */
export interface FileDataExtension<
  KeyT extends FileDataExtensionKey = FileDataExtensionKey
> {
  readonly key: KeyT;
  onBeforeSerialization?: (lyrics: string) => void;
  serialize: () => VersionedExtensionData<ExtensionData[KeyT]>;
  deserialize: (
    data: VersionedExtensionData<ExtensionData[KeyT]> | null
  ) => void;
}

export type FileDataExtensions = FileDataExtension[];
