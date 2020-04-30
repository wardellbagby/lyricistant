import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { getCssColor } from '../util/css-helpers';

export const LYRICISTANT_LANGUAGE = 'lyricistant';

export function createLyricistantTheme(useDarkTheme: boolean): string {
  const themeName: string = 'lyricistant';

  let baseTheme: monaco.editor.BuiltinTheme;
  if (useDarkTheme) {
    baseTheme = 'vs-dark';
  } else {
    baseTheme = 'vs';
  }

  monaco.editor.defineTheme(themeName, {
    base: baseTheme,
    inherit: true,
    rules: [
      {
        token: '',
        background: getCssColor('--primary-background-color'),
        foreground: getCssColor('--primary-text-color')
      }
    ],
    colors: {
      'editor.background': getCssColor('--primary-background-color'),
      'editor.foreground': getCssColor('--primary-text-color'),
      'editorLineNumber.foreground': getCssColor('--secondary-text-color')
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
