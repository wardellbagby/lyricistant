
import monacoLoader from 'monaco-loader';
let monaco: typeof import('monaco-editor');
import syllable from 'syllable';
import { fetchRhymes } from './fetchRhymes';

import { ipcRenderer } from 'electron';

import { editor, IPosition, IRange } from 'monaco-editor';
import { fromEventPattern, merge, Observable, of, Subscription } from 'rxjs';
import { NodeEventHandler } from 'rxjs/internal/observable/fromEvent';
import { debounceTime, delay, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { defineLyricistantLanguage as createLyricistantLanguage, defineLyricistantTheme as createLyricistantTheme } from './monaco-helpers';
import { Rhyme } from './Rhyme';

let editorInstance: import('monaco-editor').editor.ICodeEditor;
let modelVersion: number;
const footer: HTMLElement = document.getElementById('footer');

let footerTextUpdateSubscription: Subscription = Subscription.EMPTY;

monacoLoader()
    .then((loadedMonaco: typeof import('monaco-editor')) => {
        monaco = loadedMonaco;

        monaco.editor.setTheme(createLyricistantTheme(monaco));

        editorInstance = monaco.editor.create(document.getElementById('editor'), {
            lineNumbers: (lineNumber: number): string => syllable(editorInstance.getModel()
                .getLineContent(lineNumber))
                .toString(),
            language: createLyricistantLanguage(monaco),
            fontSize: 14,
            overviewRulerBorder: false,
            occurrencesHighlight: false,
            renderLineHighlight: 'none',
            quickSuggestions: false,
            hideCursorInOverviewRuler: true,
            minimap: {
                enabled: false
            }

        });

        setupNewFile();
        attachRhymeCompleter();
    })
    .catch((reason: any) => {
        alert(`Error loading monaco. \n${reason}`);
    });

ipcRenderer.on('new-file', (_: any) => {
    if (modelVersion !== editorInstance.getModel()
        .getAlternativeVersionId()) {
        ipcRenderer.send('prompt-save-file-for-new');
    } else {
        setupNewFile();
    }
});

ipcRenderer.on('attempt-quit', (_: any) => {
    if (modelVersion !== editorInstance.getModel()
        .getAlternativeVersionId()) {
        ipcRenderer.send('prompt-save-file-for-quit');
    } else {
        ipcRenderer.send('quit');
    }
});

ipcRenderer.on('force-new-file', (_: any) => {
    setupNewFile();
});

ipcRenderer.on('file-save-ended', (_: any, error: Error, currentFilePath: string) => {
    footerTextUpdateSubscription.unsubscribe();
    if (error) {
        alertError(error);
    } else {
        modelVersion = editorInstance
            .getModel()
            .getAlternativeVersionId();

        document.title = currentFilePath;
        footer.innerText = `${currentFilePath} saved.`;
        footerTextUpdateSubscription = of(undefined)
            .pipe(delay(3000))
            .subscribe(() => {
                footer.innerText = '';
            });
    }
});

ipcRenderer.on('file-save-started', (_: any, currentFileName: string) => {
    footer.innerText = `Saving file ${currentFileName}...`;
});

ipcRenderer.on('request-editor-text', (_: any) => {
    ipcRenderer.send('editor-text', editorInstance.getValue());
});

ipcRenderer.on('file-opened', (_: any, error: Error, currentFileName: string, data: string) => {
    if (error) {
        alertError(error);
    } else {
        document.title = currentFileName;
        editorInstance.setValue(data);
        modelVersion = editorInstance.getModel()
            .getAlternativeVersionId();
    }
});

ipcRenderer.on('undo', (_: any) => {
    editorInstance.trigger('', 'undo', '');
});

ipcRenderer.on('redo', (_: any) => {
    editorInstance.trigger('', 'redo', '');
});

ipcRenderer.on('find', (_: any) => {
    editorInstance.trigger('', 'find', '');
});

ipcRenderer.on('replace', (_: any) => {
    editorInstance.trigger('', 'replace', '');
});

function attachRhymeCompleter(): void {
    const rhymeTable: HTMLTableElement = <HTMLTableElement>document.getElementById('rhyme-table');
    fromEventPattern((handler: NodeEventHandler) => editorInstance.onDidChangeCursorPosition(handler));
    const cursorChanges: Observable<WordAtPosition> =
        fromEventPattern((handler: NodeEventHandler) => editorInstance.onDidChangeCursorPosition(handler))
            .pipe(
                map((): WordAtPosition => {
                    const cursorPosition: IPosition = editorInstance.getPosition();
                    const wordAndColumns: editor.IWordAtPosition | null = editorInstance.getModel()
                        .getWordAtPosition(cursorPosition);

                    if (!wordAndColumns) {
                        return undefined;
                    }

                    return {
                        word: wordAndColumns.word,
                        range: new monaco.Range(
                            cursorPosition.lineNumber,
                            wordAndColumns.startColumn,
                            cursorPosition.lineNumber,
                            wordAndColumns.endColumn
                        )
                    };
                }),
                filter((value: WordAtPosition) => !!value)
            );
    const selectionChanges: Observable<WordAtPosition> =
        fromEventPattern((handler: NodeEventHandler) => editorInstance.onDidChangeCursorSelection(handler))
            .pipe(
                map(() => {
                    const selectionRange: IRange = editorInstance.getSelection();

                    return {
                        word: editorInstance.getModel()
                            .getValueInRange(selectionRange),
                        range: selectionRange

                    };
                }),
                filter((value: WordAtPosition) => {
                    return value.word.length > 1 &&
                        value
                            .word
                            .charAt(0)
                            .match(/\w/) !== undefined;
                })
            );
    merge(selectionChanges, cursorChanges)
        .pipe(
            distinctUntilChanged(),
            tap(() => {
                while (rhymeTable.hasChildNodes()) {
                    rhymeTable.removeChild(rhymeTable.lastChild);
                }
            }),
            debounceTime(200),
            switchMap((data: WordAtPosition) => {

                return fetchRhymes(data.word)
                    .pipe(
                        map((rhymes: Rhyme[]) => {
                            return {
                                searchedWord: data,
                                rhymes: rhymes
                            };
                        })
                    );
            })
        )
        .subscribe((result: { searchedWord: WordAtPosition; rhymes: Rhyme[] }): void => {
            result.rhymes.forEach((rhyme: Rhyme) => {
                const row: HTMLTableRowElement = rhymeTable.insertRow(-1);
                const cell: HTMLTableCellElement = row.insertCell();
                cell.appendChild(document.createTextNode(rhyme.word));
                cell.classList.add('rhyme');
                cell.onclick = (): void => {
                    editorInstance.focus();
                    const op: editor.IIdentifiedSingleEditOperation = {
                        range: new monaco.Range(
                            result.searchedWord.range.startLineNumber,
                            result.searchedWord.range.startColumn,
                            result.searchedWord.range.endLineNumber,
                            result.searchedWord.range.endColumn
                        ),
                        text: rhyme.word,
                        forceMoveMarkers: true
                    };
                    editorInstance.executeEdits('', [op]);
                };
            });
        });
}

function setupNewFile(): void {
    document.title = 'Untitled';
    editorInstance.setValue('');
    ipcRenderer.send('new-file-created');

    modelVersion = editorInstance
        .getModel()
        .getAlternativeVersionId();
}

function alertError(error: NodeJS.ErrnoException): void {
    alert(`Error: ${error.message}`);
}

interface WordAtPosition {
    range: IRange;
    word: string;
}
