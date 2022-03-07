import {
  FileDataExtension,
  onVersion,
  VersionedExtensionData,
} from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import { Logger } from '@lyricistant/common/Logger';
import { diff_match_patch, patch_obj as Patch } from 'diff-match-patch';
import { DateTime } from 'luxon';

const CURRENT_VERSION = 1;

interface HistoryData {
  time: string;
  patches: Patch[];
}

export interface ParsedHistoryData {
  time: string;
  text: string;
}

export class FileHistory implements FileDataExtension<'history'> {
  public key: 'history' = 'history';

  private delta: HistoryData[] = [];
  private lastKnownLyrics = '';
  private readonly differ = new diff_match_patch();

  public constructor(private logger: Logger) {}

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
    this.lastKnownLyrics = this.getParsedHistory();
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
    if (lyrics === this.lastKnownLyrics || lyrics.trim().length === 0) {
      return;
    }

    this.logger.verbose('Adding file history', {
      new: lyrics,
      old: this.lastKnownLyrics,
    });

    const newPatches = this.differ.patch_make(this.lastKnownLyrics, lyrics);
    this.delta.push({
      patches: newPatches,
      time: DateTime.local().toISO(),
    });
    this.lastKnownLyrics = lyrics;
  };

  public getIncrementalParsedHistory = (): ParsedHistoryData[] => {
    let last = '';

    return this.delta.map((patch) => {
      last = this.differ.patch_apply(patch.patches, last)[0];
      return {
        time: DateTime.fromISO(patch.time).toLocaleString(
          DateTime.DATETIME_MED_WITH_SECONDS
        ),
        text: last,
      };
    });
  };

  public getParsedHistory = (): string => {
    if (this.lastKnownLyrics.length > 0) {
      return this.lastKnownLyrics;
    }

    const incrementalHistory = this.getIncrementalParsedHistory();
    this.lastKnownLyrics =
      incrementalHistory[incrementalHistory.length - 1]?.text ?? '';

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
