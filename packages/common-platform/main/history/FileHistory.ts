import {
  Change,
  FileDataExtension,
  HistoryData,
  onVersion,
} from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import {
  isHistoryData,
  isHistoryDataV1,
} from '@lyricistant/common-platform/files/extensions/FileDataExtension.guard';
import { createChunks } from '@lyricistant/common-platform/history/ChunkCreation';
import { Clock } from '@lyricistant/common-platform/time/Clock';
import { MED_WITH_SECONDS } from '@lyricistant/common-platform/time/Formats';
import {
  Chunk,
  ParsedHistoryData,
} from '@lyricistant/common/history/ParsedHistoryData';
import { Logger } from '@lyricistant/common/Logger';
import type { patch_obj } from 'diff-match-patch';

const CURRENT_VERSION = 2;

/** @deprecated Used for the V1 version of File History. Use {@link HistoryData} instead. */
export interface HistoryDataV1 {
  time: string;
  patches: patch_obj[];
}
export class FileHistory implements FileDataExtension<'history'> {
  private static readonly MAX_DELTA_SIZE = 100;
  public key: 'history' = 'history';

  private delta: HistoryData[] = [];
  private lastKnownLyrics = '';

  public constructor(private clock: Clock, private logger: Logger) {}

  public onBeforeSerialization = (lyrics: string) => {
    this.add(lyrics);
  };

  public serialize = async () => ({
    version: CURRENT_VERSION,
    data: this.delta,
  });

  public deserialize = async (extensionData: any) => {
    this.lastKnownLyrics = '';

    this.delta = await this.loadFromSerialized(extensionData);
    this.lastKnownLyrics = this.getParsedHistory();
  };

  public reset = () => {
    this.lastKnownLyrics = '';
    this.delta = [];
  };

  public isNonEmptyHistory = async (extensionData: any): Promise<boolean> =>
    (await this.loadFromSerialized(extensionData)).length > 0;

  public add = (lyrics: string) => {
    if (lyrics.trim() === this.lastKnownLyrics || lyrics.trim().length === 0) {
      return;
    }

    this.logger.verbose('Adding file history', {
      new: lyrics,
      old: this.lastKnownLyrics,
    });

    const changes = this.createChanges(this.lastKnownLyrics, lyrics);
    this.delta.push({
      changes,
      time: this.clock.now().formatIso(),
    });

    if (this.delta.length > FileHistory.MAX_DELTA_SIZE) {
      const first = this.applyChanges('', this.delta[0].changes);
      const second = this.applyChanges(first, this.delta[1].changes);
      const newChanges = this.createChanges('', second);
      this.delta.splice(0, 2, {
        changes: newChanges,
        time: this.delta[1].time,
      });
    }
    this.lastKnownLyrics = lyrics;
  };

  public getIncrementalParsedHistory = (options?: {
    /**
     * Whether to include chunk generation, which can be very expensive.
     * {@link base} will be used to compare all chunks against when showing changes.
     */
    includeChunks?: { base: string };
  }): ParsedHistoryData[] => {
    let last = '';

    return this.delta
      .map((data) => {
        const text = this.applyChanges(last, data.changes);
        let chunks: Chunk[];
        if (options?.includeChunks) {
          chunks = createChunks(
            options.includeChunks.base,
            this.createChanges(options.includeChunks.base, text)
          );
        } else {
          chunks = [];
        }
        last = text;

        return {
          time: this.clock.fromIso(data.time).formatLocal(MED_WITH_SECONDS),
          text,
          chunks,
        };
      })
      .reverse();
  };

  public getParsedHistory = (): string => {
    if (this.lastKnownLyrics.length > 0) {
      return this.lastKnownLyrics;
    }

    const incrementalHistory = this.getIncrementalParsedHistory();
    this.lastKnownLyrics = incrementalHistory[0]?.text?.trim() ?? '';

    return this.lastKnownLyrics;
  };

  private loadFromSerialized = async (
    extensionData: unknown
  ): Promise<HistoryData[]> =>
    await onVersion(extensionData, this.logger, {
      1: async (data) => this.migrateV1ToV2(await this.loadV1(data)),
      2: (data) => this.loadV2(data),
      invalid: () => [],
    });

  private loadV1 = async (data: unknown): Promise<HistoryDataV1[]> => {
    if (typeof data !== 'string') {
      this.logger.warn('Invalid history data', data);
      return [];
    }

    if (data.trim().length === 0) {
      return [];
    }

    // V1 included an extra unnecessary JSON stringify.
    const historyDataV1 = JSON.parse(data);
    if (
      Array.isArray(historyDataV1) &&
      historyDataV1.every((datum) => !isHistoryDataV1(datum))
    ) {
      this.logger.warn('Invalid history data', historyDataV1);
      return [];
    }
    return historyDataV1;
  };

  private loadV2 = async (data: unknown): Promise<HistoryData[]> => {
    if (!Array.isArray(data) || !data.every((datum) => isHistoryData(datum))) {
      return [];
    }

    return data;
  };

  private migrateV1ToV2 = async (
    data: HistoryDataV1[]
  ): Promise<HistoryData[]> => {
    let last = '';

    // Use an async import, so we don't have to pay the cost of loading this in
    // when people no longer have V1 File History.
    const DiffMatchPatch = (await import('diff-match-patch')).default
      .diff_match_patch;

    const differ = new DiffMatchPatch();
    return data.map((historyData) => {
      const newText = differ.patch_apply(historyData.patches, last)[0];
      const changes = this.createChanges(last, newText);

      const result = {
        time: historyData.time,
        changes,
      };
      last = newText;
      return result;
    });
  };

  /**
   * Given a source and an expected result, create a list of {@link Change}
   * objects that can be given to {@link applyChanges} along with the same source
   * to get the same result.
   *
   * @param source The starting point.
   * @param result The string that will be recreated when the returned changes
   *   are applied.
   */
  private createChanges = (source: string, result: string): Change[] => {
    const sourceLines = source.split('\n');
    const resultLines = result.split('\n');
    const changes: Change[] = [];
    // How many lines we expect the "result" string to be off from the "source"
    // string. Used so that when finding changes, we can avoid having to say that
    // every subsequent line has changed after a single addition or subtraction.
    let expectedOffset = 0;

    sourceLines.forEach((sourceLine, originalSourceLineIndex) => {
      const sourceLineIndex = originalSourceLineIndex + expectedOffset;
      const resultIndex = resultLines.indexOf(sourceLine, sourceLineIndex);

      if (resultIndex >= 0) {
        // We've found the source line in the result. Everything in between must
        // be additions.
        const additions = resultLines.slice(sourceLineIndex, resultIndex).map(
          (line, additionIndex): Change => ({
            type: 1,
            line: sourceLineIndex + additionIndex,
            value: line,
          })
        );
        changes.push(...additions);
        expectedOffset += additions.length;
      } else {
        if (sourceLineIndex < resultLines.length) {
          // If the result has a line at the same index, then we actually
          // changed this line so mark it as being modified.
          changes.push({
            type: 0,
            line: sourceLineIndex,
            value: resultLines[sourceLineIndex],
          });
        } else {
          // We weren't able to find the source like in the result and there's
          // no change at the same line, so the source must have been removed.
          changes.push({
            type: -1,
            line: sourceLineIndex,
          });
        }
      }
    });

    // Any lines left over in result that occur after where source ends
    // (factoring in the offset) must all be additions, so add those here.
    changes.push(
      ...resultLines.slice(sourceLines.length + expectedOffset).map(
        (line, additionIndex): Change => ({
          type: 1,
          line: sourceLines.length + additionIndex + expectedOffset,
          value: line,
        })
      )
    );

    return changes;
  };

  private applyChanges = (source: string, changes: Change[]): string => {
    const sourceLines = source.split('\n');

    changes.forEach((change) => {
      if (change.type === 1) {
        if (
          change.line < sourceLines.length &&
          sourceLines[change.line] == null
        ) {
          // Instead of unnecessarily resizing the array, just replace any nulls
          // in the same line with the added value.
          sourceLines[change.line] = change.value;
        } else {
          // Add the line to the source by shifting the array down to make room.
          sourceLines.splice(change.line, 0, change.value);
        }
      } else {
        // For removals and modifications, we change the line directly. Removals
        // are marked as null instead of forcing an array resize; it'll be
        // removed later.
        sourceLines[change.line] = change.type === 0 ? change.value : null;
      }
    });

    return sourceLines.filter((line) => typeof line === 'string').join('\n');
  };
}
