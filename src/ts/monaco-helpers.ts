export function defineLyricistantTheme(monaco: typeof import('monaco-editor')): string {
    const themeName: string = 'lyricistant';
    monaco.editor.defineTheme(themeName, {
        base: 'vs-dark',
        inherit: true,
        rules: [{ token: '', background: '141414', foreground: 'F8F8F8' }],
        colors: {
            'editor.color': '#FF0000',
            'editor.foreground': '#F8F8F8',
            'editor.background': '#141414'
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
