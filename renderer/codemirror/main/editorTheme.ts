import { Theme } from '@material-ui/core';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export const editorTheme = (appTheme: Theme): Extension =>
  EditorView.theme(
    {
      $: {
        height: '100%',
        width: '100%',
        color: appTheme.palette.text.primary,
        backgroundColor: appTheme.palette.background.default,
        '& ::selection': {
          backgroundColor: appTheme.palette.primary.main,
          color: appTheme.palette.getContrastText(
            appTheme.palette.primary.main
          ),
        },
        caretColor: appTheme.palette.text.primary,
        '&$focused': {
          outline_fallback: 'none',
          outline: 'none',
        },
      },
      $scroller: {
        fontFamily: '"Roboto Mono"',
        fontSize: appTheme.typography.fontSize,
      },
      $gutters: {
        width: '60px',
        justifyContent: 'center',
        backgroundColor: appTheme.palette.background.default,
        color: appTheme.palette.text.secondary,
        borderRight: 'none',
      },
    },
    {
      dark: appTheme.palette.type === 'dark',
    }
  );
