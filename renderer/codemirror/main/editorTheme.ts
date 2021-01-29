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
        fontFamily: '"Roboto"',
        fontSize: appTheme.typography.fontSize,
      },
      $gutters: {
        width: '60px',
        justifyContent: 'center',
        backgroundColor: appTheme.palette.background.default,
        color: appTheme.palette.text.secondary,
        borderRight: 'none',
      },
      $panel: {
        backgroundColor: appTheme.palette.background.paper,
        color: appTheme.palette.getContrastText(
          appTheme.palette.background.paper
        ),
      },
      $searchMatch: {
        backgroundColor: appTheme.palette.grey.A100,
        color: appTheme.palette.getContrastText(appTheme.palette.grey.A100),
      },
      '$searchMatch.selected': {
        backgroundColor: appTheme.palette.primary.main,
        color: appTheme.palette.primary.contrastText,
      },
      $button: {
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
      $textfield: {
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
      '$panel label': {
        display: 'none',
        fontFamily: '"Roboto"',
        fontSize: appTheme.typography.fontSize,
      },
      '$panel.search button[name = "select"]': {
        display: 'none',
      },
      '$panel.search button[name = "close"]': {
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
