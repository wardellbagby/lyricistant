import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { context, todoComment } from '@lyricistant/codemirror/lyrics-language';
import { Theme } from '@mui/material';

const textColorSelectionStyle = (appTheme: Theme) => ({
  '&::selection': {
    backgroundColor: appTheme.palette.primary.main,
    color: appTheme.palette.getContrastText(appTheme.palette.primary.main),
  },
});
export const editorTheme = (appTheme: Theme, font: string): Extension => [
  syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: tags.lineComment,
        color: appTheme.palette.text.disabled,
        ...textColorSelectionStyle(appTheme),
      },
      {
        tag: [todoComment, context],
        color: appTheme.palette.primary.main,
        ...textColorSelectionStyle(appTheme),
      },
    ])
  ),
  EditorView.theme(
    {
      '&.cm-editor': {
        backgroundColor: appTheme.palette.background.default,
        caretColor: appTheme.palette.text.primary,
        height: '100%',
      },
      '&.cm-scroller': {
        overflow: 'auto',
      },
      '&.cm-focused': {
        outline_fallback: 'none !important',
        outline: 'none !important',
      },
      '.cm-line-widget': {
        color: appTheme.palette.text.disabled,
        borderColor: appTheme.palette.text.disabled,
      },
      '.cm-line': {
        color: appTheme.palette.text.primary,
        ...textColorSelectionStyle(appTheme),
      },
      '.cm-scroller': {
        fontFamily: `"${font}"`,
        fontSize: `${appTheme.typography.fontSize}px`,
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '8px',
        paddingRight: '8px',
      },
      '.cm-gutters': {
        width: '60px',
        justifyContent: 'center',
        backgroundColor: appTheme.palette.background.default,
        color: appTheme.palette.text.secondary,
        borderRight: 'none',
      },
      '.cm-panel': {
        backgroundColor: appTheme.palette.background.paper,
        color: appTheme.palette.getContrastText(
          appTheme.palette.background.paper
        ),
      },
      '.cm-searchMatch': {
        backgroundColor: appTheme.palette.grey.A100,
        color: appTheme.palette.getContrastText(appTheme.palette.grey.A100),
      },
      '.cm-searchMatch.selected': {
        backgroundColor: appTheme.palette.primary.main,
        color: appTheme.palette.primary.contrastText,
      },
      '.cm-button': {
        background: appTheme.palette.primary.main,
        color: appTheme.palette.primary.contrastText,
        border: 'none',
        borderRadius: '0px',
        margin: '2px',
        padding: '8px',
        width: '100px',
        height: '35px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        fontFamily: '"Roboto"',
        fontSize: appTheme.typography.fontSize,
        '&:focus': {
          outline: 'none',
        },
        '&:active': {
          background: appTheme.palette.action.active,
        },
      },
      '.cm-textfield': {
        color: appTheme.palette.text.primary,
        padding: '8px',
        width: '150px',
        height: '35px',
        textDecoration: 'none',
        fontFamily: '"Roboto"',
        fontSize: appTheme.typography.fontSize,
        '&:focus': {
          outline: 'none',
        },
      },
      '.cm-panel label': {
        display: 'none',
        fontFamily: '"Roboto"',
        fontSize: appTheme.typography.fontSize,
      },
      '.cm-panel.cm-search [name=select]': {
        display: 'none',
      },
      '.cm-panel.cm-search [name=close]': {
        fontSize: '24px',
        right: '8px',
        '&:focus': {
          outline: 'none',
        },
        color: appTheme.palette.text.primary,
      },
    },
    {
      dark: appTheme.palette.mode === 'dark',
    }
  ),
];
