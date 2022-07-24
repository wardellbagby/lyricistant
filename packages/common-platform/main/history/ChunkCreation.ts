import { Change } from '@lyricistant/common-platform/files/extensions/FileDataExtension';
import {
  Chunk,
  ChunkLine,
} from '@lyricistant/common/history/ParsedHistoryData';

/**
 * Create "chunks" of changed lines and context (non-changed lines that are near
 * changed lines.)
 *
 * @param source The text that the provided changes modify.
 * @param changes The changes to create chunks out of.
 * @see Chunk
 */
export const createChunks = (source: string, changes: Change[]): Chunk[] => {
  if (!changes || changes.length === 0) {
    return [
      {
        lines: [{ type: 'context', line: '<< No changes >>', control: true }],
      },
    ];
  }
  const sourceLines = source.split('\n');

  const groups: Change[][] = createChangeGroups(changes);

  // Iterate over all groups and create displayable chunk lines for every chunk.
  return groups.map((group) => {
    const firstChange = group[0];
    const lastChange = group[group.length - 1];

    // Lines of context that are displayed before any changed lines, if possible.
    const preLines: ChunkLine[] = createStartContext(sourceLines, firstChange);
    // Lines of context that are displayed after any changed lines, if possible.
    const postLines: ChunkLine[] = createEndContext(sourceLines, lastChange);

    const chunkLines: ChunkLine[] = intRange(
      firstChange.line,
      lastChange.line + 1
    )
      .map((originalLineNumber): ChunkLine | ChunkLine[] => {
        const sourceLineData = lineOrControlCharacters(
          sourceLines[originalLineNumber]
        );
        const lineChanges = group.filter(
          (change) => change.line === originalLineNumber
        );
        const changedLineData = lineOrControlCharacters(
          applyToLine(sourceLineData?.line, lineChanges)
        );

        if (sourceLineData?.line !== changedLineData?.line) {
          // Source line doesn't match the changed line; a modification happened.
          if (
            !sourceLineData?.line ||
            (sourceLineData?.control && changedLineData?.line)
          ) {
            // There's no source line, or it was empty so don't bother with
            // an "old" and just return the new line as an addition.
            return {
              type: 'new',
              line: changedLineData.line,
              control: changedLineData.control,
            };
          }

          if (
            !changedLineData?.line ||
            (changedLineData?.control && sourceLineData?.line)
          ) {
            // There's no new line so display the old line as removed
            return {
              type: 'old',
              line: sourceLineData.line,
              control: sourceLineData.control,
            };
          }

          return [
            {
              type: 'old',
              line: sourceLineData.line,
              control: sourceLineData.control,
            },
            {
              type: 'new',
              line: changedLineData.line,
              control: changedLineData.control,
            },
          ];
        } else {
          // No changes, so this line is just context.
          return {
            type: 'context',
            line: sourceLineData.line,
            control: sourceLineData.control,
          };
        }
      })
      .reduce<ChunkLine[]>((total: ChunkLine[], curr) => {
        // Flatten nested arrays.
        if (Array.isArray(curr)) {
          total.push(...curr);
          return total;
        }
        total.push(curr);
        return total;
      }, []);

    const lines = [
      ...preLines,
      ...groupSameTypeLines(chunkLines),
      ...postLines,
    ];

    return {
      lines,
    };
  });
};

/**
 * Given the lines of the source and the first change in a change group, create
 * lines of context that should be displayed before this change group.
 *
 * @param sourceLines Lines of the source text that firstChange will be applied to.
 * @param firstChange The first change in a change group.
 * @see createChangeGroups
 */
const createStartContext = (
  sourceLines: string[],
  firstChange: Change
): ChunkLine[] => {
  if (firstChange.line === 0) {
    return [];
  }

  const startContextLineNumber = Math.max(firstChange.line - 2, 0);
  // There are some lines we can display before the first group; add them.
  return sourceLines
    .slice(startContextLineNumber, firstChange.line)
    .map((line): ChunkLine => {
      const value = lineOrControlCharacters(line);
      return {
        type: 'context',
        line: value.line,
        control: value.control,
      };
    });
};

/**
 * Given the lines of the source and the last change in a change group, create
 * lines of context that should be displayed after this change group.
 *
 * @param sourceLines Lines of the source text that firstChange will be applied to.
 * @param lastChange The last change in a change group.
 * @see createChangeGroups
 */
const createEndContext = (
  sourceLines: string[],
  lastChange: Change
): ChunkLine[] => {
  const lines: ChunkLine[] = [];
  const maxSourceLineIndex = sourceLines.length - 1;
  if (lastChange.line < maxSourceLineIndex) {
    const endContextLineNumber = Math.min(
      lastChange.line + 2,
      maxSourceLineIndex
    );

    // There are some lines we can display after the last group; add them.
    lines.push(
      ...sourceLines
        .slice(lastChange.line + 1, endContextLineNumber)
        .map((line): ChunkLine => {
          const value = lineOrControlCharacters(line);
          return {
            type: 'context',
            line: value.line,
            control: value.control,
          };
        })
    );
  }
  if (lastChange.line >= maxSourceLineIndex) {
    lines.push({
      type: 'context',
      line: '<< End of file >>',
      control: true,
    });
  }

  return lines;
};

/**
 * Group changes that occur close together. Close together is defined by the
 * lines being modified by a change being within 3 lines of another change.
 *
 * @param changes The changes to group.
 */
const createChangeGroups = (changes: Change[]): Change[][] => {
  const groups: Change[][] = [];
  let groupIndex = 0;

  // Group changes that are close together, so they can be displayed in the same chunk.
  changes
    .sort((a, b) => a.line - b.line)
    .forEach((change, index) => {
      if (index === 0) {
        groups[groupIndex] = [change];
        return;
      }

      const lastChange = changes[index - 1];

      if (change.line - lastChange.line < 3) {
        groups[groupIndex].push(change);
      } else {
        groupIndex += 1;
        groups[groupIndex] = [change];
      }
    });

  return groups;
};

/**
 * Applies all changes to the current line, even if they weren't orignally for this line.
 *
 * @param line The line to apply changes to.
 * @param changes The changes to apply.
 */
const applyToLine = (line: string, changes: Change[]): string => {
  let result = line;
  changes.forEach((change) => {
    if (change.type === -1) {
      result = null;
    } else {
      result = change.value;
    }
  });
  return result;
};

/**
 * Potentially converts a line to be a "control characters" line, which means it
 * represents something that can be visibly represented as characters, like a
 * new line. If this line represents such characters, it will instead be
 * replaced and {@link control} will be true. Otherwise, the line will be
 * returned and {@link control will be false.} If line is null or undefined, this
 * will return null.
 *
 * @param line The line to check.
 */
const lineOrControlCharacters = (
  line: string
): { line: string; control: boolean } => {
  if (line === undefined || line === null) {
    return null;
  }
  if (line.length === 0) {
    return { line: '<< Empty line >>', control: true };
  }
  return { line, control: false };
};

/**
 * Given a list of chunk lines, group lines that are of the same type so that
 * they are displayed after each other if they modifify consequtive lines.
 *
 * That is to say, if {@link lines} looks like:
 *
 * ```typescript
 * [{ type: 'old' }, { type: 'new' }, { type: 'old' }, { type: 'new' }];
 * ```
 *
 * It will become:
 *
 * ```typescript
 * [{ type: 'old' }, { type: 'old' }, { type: 'new' }, { type: 'new' }];
 * ```
 *
 * This will only affect consecutive alternating lines. A multiple olds, news,
 * or any contexts will end the grouping.
 *
 * @param lines
 */
const groupSameTypeLines = (lines: ChunkLine[]): ChunkLine[] => {
  const result: ChunkLine[] = [];
  let lastType: ChunkLine['type'] = null;
  let currentGroup: ChunkLine[] = null;

  const endGrouping = () => {
    currentGroup.sort((left, right) => {
      if (left.type === 'old' && right.type === 'new') {
        return -1;
      } else if (right.type === 'old' && left.type === 'new') {
        return 1;
      }
      return 0;
    });
    result.push(...currentGroup);
    lastType = null;
    currentGroup = null;
  };

  for (const line of lines) {
    if (line.type === 'context') {
      endGrouping();
      result.push(line);
      continue;
    }

    if (!lastType) {
      currentGroup = [line];
      lastType = line.type;
      continue;
    }

    currentGroup.push(line);
    lastType = line.type;
  }

  if (currentGroup) {
    endGrouping();
  }

  return result;
};

const intRange = (start: number, end: number): number[] =>
  [...Array(end - start).keys()].map((i) => i + start);
