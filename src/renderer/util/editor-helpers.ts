import { Editor, Position, Range as CMRange } from 'codemirror';

export const LYRICISTANT_LANGUAGE = 'lyricistant';

export const findWordAt = (editor: Editor, position: Position) => {
  const index = position.ch;
  const line = editor.getLine(position.line);
  const isDelimiter = (c: string) => /[^\w\-']+/.exec(c);
  let start = index - 1;
  let end = index;

  while (start >= 0 && !isDelimiter(line[start])) {
    start -= 1;
  }
  start = Math.max(0, start + 1);

  while (end < line.length && !isDelimiter(line[end])) {
    end += 1;
  }
  end = Math.max(start, end);

  return {
    range: Range(
      { line: position.line, ch: start },
      {
        line: position.line,
        ch: end
      }
    ),
    word: line.substring(start, end),
    empty() {
      return this.range.empty() || !this.word;
    }
  };
};

export const Range = (from: Position, to: Position): CMRange => {
  return {
    anchor: to,
    head: from,
    empty: () => to.line === from.line && to.ch === from.ch,
    from: () => from,
    to: () => to
  };
};

export interface Range extends CMRange {
  new (value?: any): CMRange;
}
