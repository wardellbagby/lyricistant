export function defineLyricistantTheme(monaco: typeof import('monaco-editor')): string {
    const themeName: string = 'lyricistant';
    monaco.editor.defineTheme(themeName, {
        base: 'vs-dark',
        inherit: true,
        rules: [{
            token: '',
            background: getCssColor('--primary-background-color'),
            foreground: getCssColor('--primary-text-color')
        }],
        colors: {
            'editor.background': getCssColor('--primary-background-color'),
            'editor.foreground': getCssColor('--primary-text-color')
        }
    });

    return themeName;
}

export function defineLyricistantLanguage(monaco: typeof import('monaco-editor')): string {
    const languageName: string = 'lyricistant';
    monaco.languages.register({
        id: languageName
    });
    monaco.languages.setLanguageConfiguration(languageName, {
        wordPattern: /'?\w[\w'-.]*[?!,;:"]*/
    });

    return languageName;
}

function getCssColor(variableName: string): string {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
}
