import { Extension } from '@codemirror/state';
import { lineNumbers } from '@codemirror/view';
import {
  getNodesBetween,
  getLyricNodesBetween,
  joinNodesToText,
} from '@lyricistant/codemirror/SyntaxNodes';
import syllable from 'syllable';

export const syllableCounts = (): Extension =>
  lineNumbers({
    formatNumber: (lineNo, state) => {
      if (lineNo > state.doc.lines) {
        return '0';
      }

      const { from, to } = state.doc.line(lineNo);
      const nodes = getNodesBetween(state, from, to);
      const supportedNodes = getLyricNodesBetween(state, from, to);

      if (nodes.length === 0) {
        return '0';
      }
      if (supportedNodes.length === 0) {
        return ' ';
      }

      const text = joinNodesToText(state, supportedNodes);
      return syllable(text).toString();
    },
  });
