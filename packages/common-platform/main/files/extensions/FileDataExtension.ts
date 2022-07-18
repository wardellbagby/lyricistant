import { ExtensionData } from '@lyricistant/common-platform/files/Files';
import { Logger } from '@lyricistant/common/Logger';

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
 * @param logger A logger
 * @param handlers An object mapping versions to handler functions.
 */
export const onVersion = async <R = void>(
  extensionData: VersionedExtensionData<string> | null,
  logger: Logger,
  handlers: {
    [version: number]: () => R | Promise<R>;
    invalid: () => R | Promise<R>;
  }
): Promise<R> => {
  const version = extensionData?.version;

  if (version && version in handlers) {
    try {
      return handlers[version]();
    } catch (e) {
      logger.warn(
        'Exception when deserializing extension data',
        extensionData,
        e
      );
      return handlers.invalid();
    }
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
  serialize: () => Promise<VersionedExtensionData<ExtensionData[KeyT]>>;
  deserialize: (
    data: VersionedExtensionData<ExtensionData[KeyT]>
  ) => Promise<void>;
  reset: () => void;
}

export type FileDataExtensions = FileDataExtension[];
