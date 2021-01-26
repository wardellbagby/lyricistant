import { Extension } from '@codemirror/state';
import { lineNumbers } from "@codemirror/gutter";
import { Text } from '@codemirror/text';
import syllable from 'syllable';

export const syllableCounts = (getDocument: () => Text): Extension =>
  lineNumbers({
    formatNumber: (lineNo) => {
      if (lineNo > getDocument().lines) {
        return '0';
      }
      return syllable(getDocument().line(lineNo).text).toString();
    }
  });
