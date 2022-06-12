import { SelectionRange, Text } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export interface TextSelectionData {
  from: number;
  to: number;
  text: string;
}

export const textSelection = (
  onTextSelected: (word: TextSelectionData) => void
) => [
  EditorView.updateListener.of((update) => {
    if (update.selectionSet) {
      onTextSelected(
        findWordAt(update.state.doc, update.state.selection.asSingle().main)
      );
    }
  }),
];

export const findWordAt = (document: Text, position: SelectionRange) => {
  const line = document.lineAt(position.head);
  const isDelimiter = (c: string) => /[^\w\-']+/.exec(c);

  let start;
  let end;

  if (position.empty) {
    if (position.assoc === 1) {
      start = position.from - line.from;
      end = position.from + 1 - line.from;
    } else {
      start = position.from - 1 - line.from;
      end = position.from - line.from;
    }
  } else {
    start = position.from - line.from;
    end = position.to - line.from;
  }

  while (start >= 0 && !isDelimiter(line.text[start])) {
    start -= 1;
  }
  start = Math.max(0, start + 1);

  while (end < line.length && !isDelimiter(line.text[end])) {
    end += 1;
  }
  end = Math.max(start, end);

  return {
    from: start + line.from,
    to: end + line.from,
    text: line.text.substring(start, end),
  };
};
