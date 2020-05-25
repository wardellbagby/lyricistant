import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { getThemePalette } from './theme';

export const LYRICISTANT_LANGUAGE = 'lyricistant';

export function createLyricistantTheme(useDarkTheme: boolean): string {
  const themeName: string = 'lyricistant';

  let baseTheme: monaco.editor.BuiltinTheme;
  if (useDarkTheme) {
    baseTheme = 'vs-dark';
  } else {
    baseTheme = 'vs';
  }

  const themePalette = getThemePalette(useDarkTheme);

  monaco.editor.defineTheme(themeName, {
    base: baseTheme,
    inherit: true,
    rules: [
      {
        token: '',
        background: themePalette.primaryBackground,
        foreground: themePalette.primaryText
      }
    ],
    colors: {
      'editor.background': themePalette.primaryBackground,
      'editor.foreground': themePalette.primaryText,
      'editorLineNumber.foreground': themePalette.secondaryText
    }
  });

  return themeName;
}

export function createLyricistantLanguage() {
  monaco.languages.register({
    id: LYRICISTANT_LANGUAGE
  });
  monaco.languages.setLanguageConfiguration(LYRICISTANT_LANGUAGE, {
    wordPattern: /'?\w[\w'\-]*/
  });
}
