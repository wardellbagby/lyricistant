import { editor } from 'monaco-editor';

export function createLyricistantTheme(monaco: typeof import('monaco-editor')): string {
    const themeName: string = 'lyricistant';

    let baseTheme: editor.BuiltinTheme;
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        baseTheme = 'vs';
    } else {
        baseTheme = 'vs-dark';
    }

    monaco.editor.defineTheme(themeName, {
        base: baseTheme,
        inherit: true,
        rules: [{
            token: '',
            background: getCssColor('--primary-background-color'),
            foreground: getCssColor('--primary-text-color')
        }],
        colors: {
            'editor.background': getCssColor('--primary-background-color'),
            'editor.foreground': getCssColor('--primary-text-color'),
            'editorLineNumber.foreground': getCssColor('--secondary-text-color')
        }
    });

    return themeName;
}

export function createLyricistantLanguage(monaco: typeof import('monaco-editor')): string {
    const languageName: string = 'lyricistant';
    monaco.languages.register({
        id: languageName
    });
    monaco.languages.setLanguageConfiguration(languageName, {
        wordPattern: /'?\w[\w'\-]*/
    });

    return languageName;
}

function getCssColor(variableName: string): string {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
}
