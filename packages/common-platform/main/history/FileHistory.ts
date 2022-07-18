import {
  FileDataExtension,
  onVersion,
  VersionedExtensionData,
} from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import {
  Chunk,
  ChunkLine,
  ParsedHistoryData,
} from '@lyricistant/common/history/ParsedHistoryData';
import { Logger } from '@lyricistant/common/Logger';
import type { patch_obj } from 'diff-match-patch';
import { DateTime } from 'luxon';

const CURRENT_VERSION = 2;

/** @deprecated Used for the V1 version of File History. Use {@link HistoryData} instead. */
interface HistoryDataV1 {
  time: string;
  patches: patch_obj[];
}

interface HistoryData {
  time: string;
  changes: Change[];
}

interface Change {
  type: 'added' | 'removed';
  lineNumber: number;
  value?: string;
}

export class FileHistory implements FileDataExtension<'history'> {
  public key: 'history' = 'history';

  private delta: HistoryData[] = [];
  private lastKnownLyrics = '';

  public constructor(private logger: Logger) {}

  public onBeforeSerialization = (lyrics: string) => {
    this.add(lyrics);
  };

  public serialize = async () => ({
    version: CURRENT_VERSION,
    data: JSON.stringify(this.delta),
  });

  public deserialize = async (
    extensionData: VersionedExtensionData<string>
  ) => {
    this.lastKnownLyrics = '';
    this.delta = await onVersion<HistoryData[]>(extensionData, this.logger, {
      1: async () => this.migrateV1ToV2(await this.loadV1(extensionData.data)),
      2: () => this.loadV2(extensionData.data),
      invalid: () => [],
    });
    this.lastKnownLyrics = this.getParsedHistory();
  };

  public reset = () => {
    this.lastKnownLyrics = '';
    this.delta = [];
  };

  public isNonEmptyHistory = async (
    extensionData: VersionedExtensionData<string> | null
  ): Promise<boolean> =>
    onVersion(extensionData, this.logger, {
      1: async () => {
        const history = await this.loadV1(extensionData.data);
        return (
          history.length > 0 && history.some((data) => data.patches.length > 0)
        );
      },
      2: async () => {
        const history = await this.loadV2(extensionData.data);
        return (
          history.length > 0 && history.some((data) => data.changes.length > 0)
        );
      },
      invalid: () => false,
    });

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
      time: DateTime.local().toISO(),
    });
    this.lastKnownLyrics = lyrics;
  };

  public getIncrementalParsedHistory = (options?: {
    /** Whether to include chunk generation, which can be very expensive. */
    includeChunks?: boolean;
  }): ParsedHistoryData[] => {
    let last = '';

    return this.delta
      .map((data) => {
        const text = this.applyChanges(last, data.changes);
        let chunks: Chunk[];
        if (options?.includeChunks) {
          chunks = this.createChunks(last, data.changes);
        } else {
          chunks = [];
        }
        last = text;

        return {
          time: DateTime.fromISO(data.time).toLocaleString(
            DateTime.DATETIME_MED_WITH_SECONDS
          ),
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

  private loadV1 = async (data: string): Promise<HistoryDataV1[]> => {
    if (data.trim().length === 0) {
      return [];
    } else {
      return JSON.parse(data);
    }
  };

  private loadV2 = async (data: string): Promise<HistoryData[]> => {
    if (data.trim().length === 0) {
      return [];
    }
    return JSON.parse(data);
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
        const additions = resultLines
          .slice(sourceLineIndex, resultIndex)
          .map((line, additionIndex) => ({
            type: 'added' as const,
            lineNumber: sourceLineIndex + additionIndex,
            value: line,
          }));
        changes.push(...additions);
        expectedOffset += additions.length;
      } else {
        // We weren't able to find the source like in the result, so it must
        // have been removed.
        changes.push({
          type: 'removed' as const,
          lineNumber: sourceLineIndex,
        });
        if (sourceLineIndex < resultLines.length) {
          // If the result has a line at the same index, then we actually
          // changed this line so mark it as being a new line added (since we
          // don't currently support "modified" lines).
          changes.push({
            type: 'added' as const,
            lineNumber: sourceLineIndex,
            value: resultLines[sourceLineIndex],
          });
        }
      }
    });

    // Any lines left over in result that occur after where source ends
    // (factoring in the offset) must all be additions, so add those here.
    changes.push(
      ...resultLines
        .slice(sourceLines.length + expectedOffset)
        .map((line, additionIndex) => ({
          type: 'added' as const,
          lineNumber: sourceLines.length + additionIndex + expectedOffset,
          value: line,
        }))
    );

    return changes;
  };

  private applyChanges = (source: string, changes: Change[]): string => {
    const sourceLines = source.split('\n');

    changes.forEach((change) => {
      if (change.type === 'added') {
        if (
          change.lineNumber < sourceLines.length &&
          sourceLines[change.lineNumber] == null
        ) {
          // Instead of unnecessarily resizing the array, just replace any nulls
          // in the same line with the added value.
          sourceLines[change.lineNumber] = change.value;
        } else {
          // Add the line to the source by shifting the array down to make room.
          sourceLines.splice(change.lineNumber, 0, change.value);
        }
      } else if (change.type === 'removed') {
        // Mark it as null instead of forcing an array resize; it'll be removed later.
        sourceLines[change.lineNumber] = null;
      }
    });

    return sourceLines.filter((line) => typeof line === 'string').join('\n');
  };

  private createChunks = (source: string, changes: Change[]): Chunk[] => {
    const sourceLines = source.split('\n');

    const groups: Change[][] = [];
    let groupIndex = 0;

    // Group changes that are close together, so they can be displayed in the same chunk.
    changes
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .forEach((change, index) => {
        if (index === 0) {
          groups[groupIndex] = [change];
          return;
        }

        const lastChange = changes[index - 1];

        if (change.lineNumber - lastChange.lineNumber < 3) {
          groups[groupIndex].push(change);
        } else {
          groupIndex += 1;
          groups[groupIndex] = [change];
        }
      });

    const maxSourceLineIndex = sourceLines.length - 1;

    // Quick and dirty "apply" that naively applies all changes to this line,
    // even if they don't match since we can trust that the changes given here
    // are valid.
    const applyToLine = (line: string, lineChanges: Change[]): string => {
      let result = line;
      lineChanges.forEach((change) => {
        if (change.type === 'removed') {
          result = '';
        } else if (change.type === 'added') {
          result = change.value;
        }
      });
      return result;
    };

    const lineOrControlCharacters = (
      line: string
    ): { line: string; control: boolean } => {
      if (line === undefined || line.length === 0) {
        return { line: '<< Empty line >>', control: true };
      }
      return { line, control: false };
    };

    // Iterate over all groups and create displayable chunk lines for every chunk.
    return groups.map((group) => {
      // Displayed before any changed lines, if possible.
      let preLines: ChunkLine[] = [];
      // Displayed after any changed lines, if possible.
      let postLines: ChunkLine[] = [];
      const firstChange = group[0];
      const lastChange = group[group.length - 1];

      if (firstChange.lineNumber > 0) {
        const startContextLineNumber = Math.max(firstChange.lineNumber - 2, 0);
        // There are some lines we can display before the first group; add them.
        preLines = sourceLines
          .slice(startContextLineNumber, firstChange.lineNumber)
          .map((line) => {
            const value = lineOrControlCharacters(line);
            return {
              type: 'context',
              line: value.line,
              control: value.control,
            };
          });
      }

      if (lastChange.lineNumber < maxSourceLineIndex) {
        const endContextLineNumber = Math.min(
          lastChange.lineNumber + 2,
          maxSourceLineIndex
        );

        // There are some lines we can display after the last group; add them.
        postLines = sourceLines
          .slice(lastChange.lineNumber + 1, endContextLineNumber)
          .map((line) => {
            const value = lineOrControlCharacters(line);
            return {
              type: 'context',
              line: value.line,
              control: value.control,
            };
          });
      }
      if (lastChange.lineNumber >= maxSourceLineIndex) {
        postLines.push({
          type: 'context',
          line: '<< End of file >>',
          control: true,
        });
      }

      const chunkLines: ChunkLine[] = this.intRange(
        firstChange.lineNumber,
        lastChange.lineNumber + 1
      )
        .map((originalLineNumber) => {
          const { line: sourceLine, control: isSourceControl } =
            lineOrControlCharacters(sourceLines[originalLineNumber]);
          const lineChanges = group.filter(
            (change) => change.lineNumber === originalLineNumber
          );
          const { line: changedLine, control: isChangedControl } =
            lineOrControlCharacters(applyToLine(sourceLine, lineChanges));

          if (
            sourceLine !== changedLine ||
            (lineChanges.length > 0 && (isSourceControl || isChangedControl))
          ) {
            // Source line doesn't match the changed line; a modification happened.
            if (!sourceLine || isSourceControl) {
              // There's no source line, or it was empty so don't bother with
              // an "old" and just return the new line as an addition.
              return {
                type: 'new',
                line: changedLine,
                control: isChangedControl,
              } as const;
            }

            return [
              {
                type: 'old',
                line: sourceLine,
                control: isSourceControl,
              } as const,
              {
                type: 'new',
                line: changedLine,
                control: isChangedControl,
              } as const,
            ];
          } else {
            // No changes, so this line is just context.
            return {
              type: 'context',
              line: sourceLine,
              control: isSourceControl,
            } as const;
          }
        })
        .reduce((total: ChunkLine[], curr) => {
          // Flatten nested arrays.
          if (Array.isArray(curr)) {
            total.push(...curr);
            return total;
          }
          total.push(curr);
          return total;
        }, []);

      const lines = [...preLines, ...chunkLines, ...postLines];

      return {
        lines,
      };
    });
  };

  private intRange(start: number, end: number): number[] {
    return [...Array(end - start).keys()].map((i) => i + start);
  }
}
