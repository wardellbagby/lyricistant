import { syntaxTree } from '@codemirror/language';
import { EditorState, SelectionRange } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';

export const joinNodesToText = (
  state: EditorState,
  nodes: SyntaxNode[]
): string => nodes.map((node) => state.sliceDoc(node.from, node.to)).join(' ');

const nonLyricNodeTypes = ['LineComment', 'TodoComment', 'Context'];

export const getLyricNodesBetween = (
  state: EditorState,
  from: number,
  to: number
) =>
  getNodesBetween(state, from, to).filter(
    (node) => !nonLyricNodeTypes.find((name) => name === node.type.name)
  );

export const doesNodeContainSelection = (
  node: SyntaxNode,
  selection: SelectionRange
): boolean => node.from <= selection.to && node.to >= selection.to;

export const getNodesBetween = (
  state: EditorState,
  from: number,
  to: number
) => {
  const nodes = [];
  const cursor = syntaxTree(state).cursorAt(from, 1);
  let pos = from;
  while (pos < to) {
    let checkChild = true;
    if (cursor.node.to <= to) {
      nodes.push(cursor.node);
      checkChild = false;
    }
    if (!cursor.next(checkChild)) {
      return nodes;
    }
    pos = cursor.from;
  }

  return nodes;
};
