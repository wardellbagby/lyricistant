import {
  FileData,
  LYRICS_EXTENSION,
  PlatformFile,
} from '@lyricistant/common/files/Files';
import JSZip from 'jszip';
import { FileHandler } from '@lyricistant/common/files/handlers/FileHandler';

type LyricsArchive = typeof JSZip;
/**
 * The version number of .lyrics files. Increment on incompatible changes to the
 * file schema.
 */

const LYRICISTANT_FILE_VERSION = 1;
const LYRICS_V1_FILE = 'lyrics.txt';
const VERSION_FILE = 'version.json';

interface VersioningData {
  version: number;
  createdWith: string;
}

export class LyricistantFileHandler implements FileHandler {
  public canHandle = (file: PlatformFile) =>
    file.type === 'application/zip' ||
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

    return archive
      .file(LYRICS_V1_FILE, file.lyrics)
      .file('version.json', JSON.stringify(this.createVersion()))
      .generateAsync({
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

const loadV1 = async (archive: LyricsArchive): Promise<FileData> => ({
  lyrics: (await archive.file(LYRICS_V1_FILE).async('string')) ?? '',
});
