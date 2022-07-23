import { Serializable } from '@lyricistant/common/Serializable';

/**
 * Provides a way to persist data across multiple launches of Lyricistant in a
 * platform-agnostic way.
 */
export interface AppData {
  /**
   * Sets the given data to be persisted until cleared by the app or the users
   * using the given key.
   *
   * @param key The key to use to retrieve or overwrite this data.
   * @param data The data to save.
   */
  set: (key: string, data: Serializable) => void;
  /**
   * Retrieve the data associated with the given key. If there is no data with
   * this given key, this method will return undefined. It is expected that
   * consumers will call {@link exists} if they need to know if any data exists
   * with this key instead of relying on the result from this method.
   *
   * @param key The key used in {@link set} to save the data previously.
   */
  get: (key: string) => Promise<Serializable>;
  /**
   * Whether any data is stored for the given {@link key}.
   *
   * @param key The key used in {@link set} to save the data previously.
   */
  exists: (key: string) => Promise<boolean>;
  /**
   * Deletes any stored data saved with this key.
   *
   * @param key The key used in {@link set} to save the data previously.
   */
  delete: (key: string) => void;
}
