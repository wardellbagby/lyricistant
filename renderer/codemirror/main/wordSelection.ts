import { EditorView } from '@codemirror/view';
import { Text } from "@codemirror/text";
import { SelectionRange } from "@codemirror/state";

export interface WordAtPosition {
  from: number;
  to: number;
  word: string;
}

export interface WordSelectionConfig {
  onWordSelected: (word: WordAtPosition) => void;
}
export const wordSelection = (config: WordSelectionConfig) => [
    EditorView.updateListener.of((update) => {
      if (update.selectionSet) {
        config.onWordSelected(
          findWordAt(update.state.doc, update.state.selection.asSingle().main)
        );
      }
    }),
  ];

const findWordAt = (document: Text, position: SelectionRange) => {
  const line = document.lineAt(position.head);
  const isDelimiter = (c: string) => /[^\w\-']+/.exec(c);
  let start; let end;
  if(position.assoc === 1) {
    start = position.head;
    end = position.head + 1
  } else {
    start = position.head - 1;
    end = position.head;
  }

  while (start >= line.from && !isDelimiter(line.text[start])) {
    start -= 1;
  }
  start = Math.max(0, start + 1);

  while (end < line.to && !isDelimiter(line.text[end])) {
    end += 1;
  }
  end = Math.max(start, end);

  return {
    from: start,
    to: end,
    word: line.text.substring(start, end),
  };
};
