import {
  FileMetadata,
  PlatformFile,
} from '@lyricistant/common/files/PlatformFile';
import { ExtensionData } from '@lyricistant/common-platform/files/extensions/FileDataExtension';

export type SerializedExtensions = {
  [extensionKey in keyof ExtensionData]?: ArrayBuffer;
};
export interface FileData {
  /** The data contained with this file. * */
  lyrics: string;
  /** Potential extensions that exist on this file data. */
  extensions?: SerializedExtensions;
}

/** The mime type for the Lyrics file format. */
export const LYRICS_MIME_TYPE = 'application/zip';
/** The file extension for the Lyrics file format. */
export const LYRICS_EXTENSION = '.lyrics';
/** Mime types that Lyricistant supports opening. */
export const SUPPORTED_MIME_TYPES = ['text/plain', LYRICS_MIME_TYPE];
/** File extensions that Lyricistant supports opening. */
export const SUPPORTED_EXTENSIONS = ['.txt', LYRICS_EXTENSION];

/**
 * An interface that represents the minimum functionality that a platform must
 * implement in order for Lyricistant to open and save files.
 *
 * What opening and saving files mean exactly can be decided by the platform
 * itself, but generally it is expected that users will be able to save a file
 * to a location on their device, then later re-open that file and see the exact
 * file that they had previously saved.
 */
export interface Files {
  /**
   * Whether this platform supports letting the user pick their own file name.
   * If false, the user will be prompted to choose their file name before
   * {@link saveFile} is called.
   */
  supportsChoosingFileName: () => boolean | Promise<boolean>;
  /**
   * Open a file from the platform. If file is provided, it is a file that the
   * user had dragged-and-dropped onto Lyricistant. If file is not provided,
   * this should open a file picker.
   *
   * @param file Optionally a file that was dragged and dropped.
   */
  openFile: (file?: PlatformFile) => Promise<PlatformFile>;
  /**
   * Save the given data to a file. If this attempt to save the file was
   * cancelled by the user, this method should return null. If it failed due to
   * an unexpected error, it should reject.
   *
   * @param data The data to write directly to a file.
   * @param defaultFileName The default file name, with extension, to use. If
   *   {@link supportsChoosingFileName} is false, this is the file name the user entered.
   * @param path Optionally, the path that is associated with this file. A path
   *   will be associated with this file if the user explicitly opened a file
   *   using {@link openFile}, and the path provided here will be the same
   *   returned by {@link openFile}. Otherwise, this will be null.
   */
  saveFile: (
    data: ArrayBuffer,
    defaultFileName: string,
    path?: string
  ) => Promise<FileMetadata>;
  /**
   * Optional functionality that platforms are not required to implement that
   * allows reading a file directly without opening a file picker based on a
   * path. The path given here will always be a path that was previously
   * returned by {@link openFile}.
   *
   * @param path The path to open.
   */
  readFile?: (path: string) => Promise<PlatformFile>;
}
