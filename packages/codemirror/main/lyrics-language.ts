import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { styleTags, tags as t, Tag } from '@lezer/highlight';
import { parser } from './lyrics.grammar';

export const todoComment = Tag.define();
export const context = Tag.define();
const LyricsLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        LineComment: t.lineComment,
        TodoComment: todoComment,
        Context: context,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: '//' },
  },
});

export const Lyrics = () => new LanguageSupport(LyricsLanguage);
