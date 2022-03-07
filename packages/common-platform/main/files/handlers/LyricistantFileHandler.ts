import {
  ExtensionData,
  FileData,
  LYRICS_EXTENSION,
} from '@lyricistant/common-platform/files/Files';
import { FileHandler } from '@lyricistant/common-platform/files/handlers/FileHandler';
import { PlatformFile } from '@lyricistant/common/files/PlatformFile';
import JSZip from 'jszip';
import { isEqual } from 'lodash-es';

type LyricsArchive = typeof JSZip;
/**
 * The version number of .lyrics files. Increment on incompatible changes to the
 * file schema.
 */

const LYRICISTANT_FILE_VERSION = 1;
const LYRICS_V1_FILE = 'lyrics.txt';
const EXTENSIONS_FOLDER = 'extensions';
const VERSION_FILE = 'version.json';

interface VersioningData {
  version: number;
  createdWith: string;
}

export class LyricistantFileHandler implements FileHandler {
  public extension = 'lyrics';

  public canHandle = (file: PlatformFile) =>
    file.type === 'application/zip' ||
    // ZIP file magic number header.
    isEqual(
      new Uint8Array(file.data).subarray(0, 4),
      Uint8Array.from([80, 75, 3, 4])
    ) ||
    file.metadata.path.endsWith(LYRICS_EXTENSION) ||
    file.metadata?.name?.endsWith(LYRICS_EXTENSION);

  public load = async (file: PlatformFile): Promise<FileData> => {
    const archive: LyricsArchive = new JSZip();
    await archive.loadAsync(file.data);

    const { version, createdWith } = await this.readVersion(archive);

    if (!version || version <= 0) {
      throw new Error('This file is incompatible with Lyricistant.');
    }

    if (version === 1) {
      return loadV1(archive);
    }

    throw new Error(
      `This file is not compatible with this version of Lyricistant. Try using version ${createdWith}`
    );
  };

  public create = async (file: FileData): Promise<ArrayBuffer> => {
    const archive: LyricsArchive = new JSZip();

    archive
      .file(LYRICS_V1_FILE, file.lyrics)
      .file('version.json', JSON.stringify(this.createVersion()));

    const extensions = archive.folder('extensions');
    Object.keys(file.extensions)
      .filter((value) => value !== 'lyrics')
      .forEach((key: keyof ExtensionData) => {
        extensions.file(`${key}.dat`, file.extensions?.[key]);
      });

    return archive.generateAsync({
      type: 'arraybuffer',
    });
  };

  private readVersion = async (
    archive: LyricsArchive
  ): Promise<VersioningData> =>
    JSON.parse(await archive.file(VERSION_FILE).async('string'));

  private createVersion = (): VersioningData => ({
    version: LYRICISTANT_FILE_VERSION,
    createdWith: process.env.APP_VERSION,
  });
}

const loadV1 = async (archive: LyricsArchive): Promise<FileData> => {
  const fileData: FileData = {
    lyrics: (await archive.file(LYRICS_V1_FILE).async('string')) ?? '',
  };

  const extensions: ExtensionData = {};
  const extensionDataFiles = archive.folder('extensions').filter(() => true);
  for (const file of extensionDataFiles) {
    const name = file.name
      .replace(`${EXTENSIONS_FOLDER}/`, '')
      .replace('.dat', '');
    extensions[name] = await file.async('string');
  }

  return {
    extensions,
    ...fileData,
  };
};
