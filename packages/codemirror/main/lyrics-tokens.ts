import { ExternalTokenizer } from '@lezer/lr';
import { Lyric } from './lyrics.grammar';

const FORWARD_SLASH = '/'.charCodeAt(0);
const NEW_LINE = '\n'.charCodeAt(0);
const EOF = -1;

export const lyric = new ExternalTokenizer((input) => {
  let current = input.peek(0);
  let next = input.peek(1);

  if (current === EOF || current === NEW_LINE) {
    return;
  }

  while (true) {
    if (current === FORWARD_SLASH && next === FORWARD_SLASH) {
      input.acceptToken(Lyric);
      return;
    }

    if (next === NEW_LINE || next === EOF) {
      input.acceptToken(Lyric, 1);
      return;
    }

    current = input.advance();
    next = input.peek(1);
  }
});
