import { fetchRhymes } from 'common/fetchRhymes';
import syllable from 'syllable';
import '../css/default.css';

import { ipcRenderer } from 'electron';

import { createLyricistantLanguage, createLyricistantTheme } from 'common/monaco-helpers';
import { Rhyme } from 'common/rhyme';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { fromEventPattern, merge, Observable, of, Subscription } from 'rxjs';
import { NodeEventHandler } from 'rxjs/internal/observable/fromEvent';
import { debounceTime, delay, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

let editorInstance: monaco.editor.ICodeEditor;
let modelVersion: number;
const footer: HTMLElement = document.getElementById('footer');

let footerTextUpdateSubscription: Subscription = Subscription.EMPTY;

if (module.hot) {
    module.hot.accept();
}

setupDOM();

monaco.editor.setTheme(createLyricistantTheme());

const editorElement: HTMLElement = document.getElementById('editor');

editorInstance = monaco.editor.create(editorElement, {
    lineNumbers: (lineNumber: number): string => syllable(editorInstance.getModel()
        .getLineContent(lineNumber))
        .toString(),
    language: createLyricistantLanguage(),
    fontSize: parseInt(
        getComputedStyle(document.documentElement)
            .getPropertyValue('--editor-text-size'),
        10),
    overviewRulerBorder: false,
    occurrencesHighlight: false,
    renderLineHighlight: 'none',
    scrollBeyondLastLine: false,
    quickSuggestions: false,
    hideCursorInOverviewRuler: true,
    minimap: {
        enabled: false
    }
});

window.onresize = (): void => {
    editorInstance.layout({
        width: editorElement.clientWidth,
        height: editorElement.clientHeight
    });
};

setupNewFile();
attachRhymeCompleter();

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

ipcRenderer.on('dark-mode-toggled', (_: any) => {
    if (editorInstance) {
        monaco.editor.setTheme(createLyricistantTheme());
    }
});

function attachRhymeCompleter(): void {
    const rhymeTable: HTMLTableElement =  document.getElementById('rhyme-table') as HTMLTableElement;
    fromEventPattern((handler: NodeEventHandler) => editorInstance.onDidChangeCursorPosition(handler));
    const cursorChanges: Observable<WordAtPosition> =
        fromEventPattern((handler: NodeEventHandler) => editorInstance.onDidChangeCursorPosition(handler))
            .pipe(
                map((): WordAtPosition => {
                    const cursorPosition: monaco.IPosition = editorInstance.getPosition();
                    const wordAndColumns: monaco.editor.IWordAtPosition | null = editorInstance.getModel()
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
                    const selectionRange: monaco.IRange = editorInstance.getSelection();

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
            debounceTime(200),
            switchMap((data: WordAtPosition) =>
                fetchRhymes(data.word)
                    .pipe(
                        map((rhymes: Rhyme[]) => {
                            return {
                                searchedWordData: data,
                                rhymes
                            };
                        })
                    )
            ),
            tap(() => {
                while (rhymeTable.hasChildNodes()) {
                    rhymeTable.removeChild(rhymeTable.lastChild);
                }
            })
        )
        .subscribe((result: { searchedWordData: WordAtPosition; rhymes: Rhyme[] }): void => {
            result.rhymes.forEach((rhyme: Rhyme) => {
                const row: HTMLTableRowElement = rhymeTable.insertRow(-1);
                const cell: HTMLTableCellElement = row.insertCell();
                cell.appendChild(document.createTextNode(rhyme.word));
                cell.onclick = (): void => {
                    editorInstance.focus();
                    const op: monaco.editor.IIdentifiedSingleEditOperation = {
                        range: new monaco.Range(
                            result.searchedWordData.range.startLineNumber,
                            result.searchedWordData.range.startColumn,
                            result.searchedWordData.range.endLineNumber,
                            result.searchedWordData.range.endColumn
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

function setupDOM(): void {
    const container: HTMLElement = document.getElementById('app');

    const editorContainer: HTMLElement = document.createElement('div');
    editorContainer.id = 'editor';

    const detailColumn: HTMLElement = document.createElement('div');
    detailColumn.id = 'detail-column';

    const rhymeTable: HTMLElement = document.createElement('table');
    rhymeTable.id = 'rhyme-table';

    const footerContainer: HTMLElement = document.createElement('div');
    footerContainer.id = 'footer';

    detailColumn.appendChild(rhymeTable);
    container.appendChild(editorContainer);
    container.appendChild(detailColumn);
    container.appendChild(footerContainer);
    document.body.appendChild(container);
}

interface WordAtPosition {
    range: monaco.IRange;
    word: string;
}
