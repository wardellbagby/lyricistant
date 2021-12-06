import { ExtensionData } from '@lyricistant/common/files/Files';

export type FileDataExtensionKey = keyof ExtensionData;

export interface VersionedExtensionData<T> {
  version?: number;
  data?: T;
}

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
