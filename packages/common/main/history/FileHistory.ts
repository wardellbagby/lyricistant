import {
  FileDataExtension,
  VersionedExtensionData,
} from '@lyricistant/common/files/extensions/FileDataExtension';
import { diff_match_patch, patch_obj } from 'diff-match-patch';

const CURRENT_VERSION = 1;

export class FileHistory implements FileDataExtension<'history'> {
  public key: 'history' = 'history';

  private delta: patch_obj[] = [];
  private lastKnownLyrics = '';
  private readonly differ = new diff_match_patch();

  public onBeforeSerialization = (lyrics: string) => {
    this.add(lyrics);
  };

  public serialize = () => ({
    version: CURRENT_VERSION,
    data: JSON.stringify(this.delta),
  });

  public deserialize = (
    extensionData: VersionedExtensionData<string> | null
  ): void => {
    this.lastKnownLyrics = '';
    if (extensionData && extensionData.version === 1) {
      this.loadV1(extensionData.data);
    } else {
      this.delta = [];
    }
  };

  public add = (lyrics: string) => {
    const newPatches = this.differ.patch_make(this.lastKnownLyrics, lyrics);
    this.delta.push(...newPatches);
    this.lastKnownLyrics = lyrics;
  };

  public getParsedHistory = (): string => {
    if (this.lastKnownLyrics.length > 0) {
      return this.lastKnownLyrics;
    }

    this.lastKnownLyrics = this.differ.patch_apply(this.delta, '')[0];
    return this.lastKnownLyrics;
  };

  private loadV1 = (data: string) => {
    if (data.trim().length === 0) {
      this.delta = [];
    } else {
      this.delta = JSON.parse(data);
    }
  };
}
