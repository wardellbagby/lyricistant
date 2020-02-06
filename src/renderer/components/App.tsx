import { createMuiTheme, Theme, ThemeProvider } from '@material-ui/core/styles';
import { getCssColor, getCssNumber } from 'common/css-helpers';
import { IpcChannels } from 'common/ipc-channels';
import { createLyricistantLanguage, createLyricistantTheme } from 'common/monaco-helpers';
import { Rhyme } from 'common/Rhyme';
import { ipcRenderer } from 'electron';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Editor, TextReplacement, WordAtPosition } from './Editor';
import { Rhymes } from './Rhymes';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

createLyricistantLanguage();

const createTheme = (): Theme => createMuiTheme({
    palette: {
        action: {
            hover: getCssColor('--primary-color'),
            hoverOpacity: 0
        },
        background: { default: getCssColor('--primary-background-color') },
        text: {
            primary: getCssColor('--primary-text-color'),
            secondary: getCssColor('--secondary-text-color')
        },
    },
    typography: {
        fontSize: getCssNumber('--details-text-size')
    }
});

export interface AppProps {
    onShouldUpdateBackground: (newBackground: string) => void;
}

const selectedWords: Subject<WordAtPosition> = new Subject();
const textReplacements: Subject<TextReplacement> = new Subject();
const onWordSelected: (word: WordAtPosition) => void = (word) => {
    selectedWords.next(word);
};

const onRhymeClicked: (rhyme: Rhyme, range: monaco.IRange) => void = (rhyme, range) => {
    textReplacements.next({ word: rhyme.word, range });
};

export const App: FunctionComponent<AppProps> = (props: AppProps) => {
    const [theme, setTheme] = useState(createTheme());
    const fontSize = getCssNumber('--editor-text-size');

    useEffect(handleThemeChanges(setTheme, props.onShouldUpdateBackground), []);
    useEffect(handleFileChanges(), []);

    return (
        <ThemeProvider theme={theme}>
            <Fragment>
                <div id={'editor'}>
                    <Editor fontSize={fontSize} onWordSelected={onWordSelected} textReplacements={textReplacements} />
                </div>
                <div id={'detail-column'} >
                    <Rhymes queries={selectedWords} onRhymeClicked={onRhymeClicked} />
                </div>
                <ToastContainer autoClose={3000} />
            </Fragment>
        </ThemeProvider>
    );
};

function handleThemeChanges(
    setTheme: (theme: Theme) => void,
    onShouldUpdateBackground: (newBackground: string) => void
): () => void {
    return () => {
        const darkModeChangedListener = (_: any, useDarkTheme: boolean) => {
            if (useDarkTheme) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }

            const appTheme = createTheme();
            setTheme(appTheme);
            monaco.editor.setTheme(createLyricistantTheme(useDarkTheme));
            onShouldUpdateBackground(appTheme.palette.background.default)
        };
        ipcRenderer.on(IpcChannels.THEME_CHANGED, darkModeChangedListener);
        ipcRenderer.send(IpcChannels.READY_FOR_EVENTS);

        return function cleanup() {
            ipcRenderer.removeListener(IpcChannels.THEME_CHANGED, darkModeChangedListener);
        };
    };
}

function handleFileChanges(): () => void {
    return () => {
        const onFileOpened = (_: any, error: any, fileName: string, data: string) => {
            if (error) {
                // todo show error message
            } else {
                document.title = fileName;
            }
        };
        ipcRenderer.on(IpcChannels.FILE_OPENED, onFileOpened);

        const onNewFile = () => {
            document.title = 'Untitled';
        };
        ipcRenderer.on(IpcChannels.NEW_FILE_CREATED, onNewFile);

        return function cleanup() {
            ipcRenderer.removeListener(IpcChannels.FILE_OPENED, onFileOpened);
            ipcRenderer.removeListener(IpcChannels.NEW_FILE_CREATED, onNewFile);
        };
    };
}
