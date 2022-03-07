import { lineNumbers } from '@codemirror/gutter';
import { Extension } from '@codemirror/state';
import syllable from 'syllable';

export const syllableCounts = (): Extension =>
  lineNumbers({
    formatNumber: (lineNo, state) => {
      if (lineNo > state.doc.lines) {
        return '0';
      }
      return syllable(state.doc.line(lineNo).text).toString();
    },
  });
