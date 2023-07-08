/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { Logger } from '@lyricistant/common/Logger';
import { Serializable } from '@lyricistant/common/Serializable';
import { isVersionedExtensionData } from '@lyricistant/common-platform/files/extensions/FileDataExtension.guard';

export type HistoryData = {
  time: string;
  changes: Change[];
};

/**
 * Represents a change to a line in text.
 *
 * Make sure that any changes made here are also reflected in the
 * {@link isChange} method as well, since that is used to validate if an object
 * is a change or not.
 */
export type Change = {
  /** The type of the change. -1 is removed, 0 is modified, and 1 is added. */
  type: -1 | 0 | 1;
  /** The line number this change is for. */
  line: number;
  /** The new value of the line. Only available when {@link type} is 0 or 1. * */
  value?: string;
};

/**
 * Extensions are defined as optional data for secondary functionality in
 * Lyricistant, such as the history of changes within the represented file (like
 * the File History feature).
 *
 * When adding a new extension, create a new key here, create a new
 * implementation of {@link FileDataExtension} for your new key, and provide your
 * new implementation as a {@link FileDataExtensions} in {@link registerCommonPlatform}.
 */
export interface ExtensionData extends Record<string, Serializable> {
  history?: HistoryData[];
}
export type FileDataExtensionKey = keyof ExtensionData;

/** Represents some serialized data for a file extension that has an associated version. */
export interface VersionedExtensionData<
  KeyT extends FileDataExtensionKey,
  DataT = ExtensionData[KeyT]
> {
  version: number;
  data?: DataT;
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
  extensionData: any,
  logger: Logger,
  handlers: {
    [version: number]: (data: unknown) => R | Promise<R>;
    invalid: () => R | Promise<R>;
  }
): Promise<R> => {
  if (!isVersionedExtensionData(extensionData)) {
    logger.warn(
      "Tried to load extension data that didn't conform to the VersionedExtensionData type.",
      extensionData
    );
    return handlers.invalid();
  }
  const version = extensionData?.version;

  if (version && version in handlers) {
    try {
      return handlers[version](extensionData.data);
    } catch (e) {
      logger.warn('Exception when handling extension data', extensionData, e);
      return handlers.invalid();
    }
  } else {
    logger.warn(
      'No handler registered to handle extension data',
      extensionData
    );
    return handlers.invalid();
  }
};

/** Represents an optional extension onto {@link FileData}. */
export interface FileDataExtension<
  KeyT extends FileDataExtensionKey = FileDataExtensionKey
> {
  readonly key: KeyT;
  /**
   * Calls right before {@link serialize} will be called to give the extension a
   * change to prepare itself.
   *
   * @param lyrics The current lyrics the user has edited.
   */
  onBeforeSerialization?: (lyrics: string) => void;

  /**
   * Serialize this extension's state to in a JSON-compatible format such that
   * when {@link deserialize} is called with the data returned from this
   * function, this extension will have the same state as before.
   */
  serialize: () => Promise<VersionedExtensionData<KeyT>>;

  /**
   * Deserialize and restore the state of this extension from the provided {@link data}
   *
   * It is possible that this data isn't the same as what was previously
   * returned from {@link serialize} (in the case where a user has manually
   * modified the data on their platform), so take care to validate that it
   * matches your expectation.
   *
   * This is allowed to throw an exception in exceptional cases, but prefer to
   * instead restore to some empty state, as throwing will cause the file to
   * completely to load.
   *
   * @param data The result of a previous {@link serialize} call.
   */
  deserialize: (data: unknown) => Promise<void>;

  /** Reset this extension back to its default state. */
  reset: () => void;
}

export type FileDataExtensions = FileDataExtension[];
