import {
  FileDataExtension,
  onVersion,
  VersionedExtensionData,
} from '@lyricistant/common/files/extensions/FileDataExtension';
import { diff_match_patch, patch_obj as Patch } from 'diff-match-patch';
import { DateTime } from 'luxon';

const CURRENT_VERSION = 1;

interface HistoryData {
  time: string;
  patches: Patch[];
}

export class FileHistory implements FileDataExtension<'history'> {
  public key: 'history' = 'history';

  private delta: HistoryData[] = [];
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
    onVersion(extensionData, {
      1: () => (this.delta = this.loadV1(extensionData.data)),
      invalid: () => (this.delta = []),
    });
  };

  public isNonEmptyHistory = (
    extensionData: VersionedExtensionData<string> | null
  ): boolean =>
    onVersion(extensionData, {
      1: () => {
        const history = this.loadV1(extensionData.data);

        return (
          history.length > 0 && history.some((data) => data.patches.length > 0)
        );
      },
      invalid: () => false,
    });

  public add = (lyrics: string) => {
    const newPatches = this.differ.patch_make(this.lastKnownLyrics, lyrics);
    this.delta.push({
      patches: newPatches,
      time: DateTime.local().toJSON(),
    });
    this.lastKnownLyrics = lyrics;
  };

  public getParsedHistory = (): string => {
    if (this.lastKnownLyrics.length > 0) {
      return this.lastKnownLyrics;
    }

    this.delta.forEach((patch) => {
      this.lastKnownLyrics = this.differ.patch_apply(
        patch.patches,
        this.lastKnownLyrics
      )[0];
    });

    return this.lastKnownLyrics;
  };

  private loadV1 = (data: string): HistoryData[] => {
    if (data.trim().length === 0) {
      return [];
    } else {
      return JSON.parse(data);
    }
  };
}
