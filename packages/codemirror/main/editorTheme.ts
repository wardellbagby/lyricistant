import { Theme } from '@material-ui/core';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export const editorTheme = (appTheme: Theme): Extension =>
  EditorView.theme(
    {
      '&.cm-editor': {
        backgroundColor: appTheme.palette.background.default,
        caretColor: appTheme.palette.text.primary,
      },
      '&.cm-wrap': {
        height: '100%',
      },
      '&.cm-scroller': {
        overflow: 'auto',
      },
      '&.cm-focused': {
        outline_fallback: 'none',
        outline: 'none',
      },
      '.cm-line': {
        color: appTheme.palette.text.primary,
        '&::selection': {
          backgroundColor: appTheme.palette.primary.main,
          color: appTheme.palette.getContrastText(
            appTheme.palette.primary.main
          ),
        },
      },
      '.cm-scroller': {
        fontFamily: '"Roboto Mono"',
        fontSize: appTheme.typography.fontSize,
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
      dark: appTheme.palette.type === 'dark',
    }
  );
