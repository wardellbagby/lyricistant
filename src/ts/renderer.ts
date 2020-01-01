import { RhymeCompleter } from './RhymeCompleter';
import { SyllableCountRenderer } from './SyllableCountRenderer';

import { ipcRenderer } from 'electron';

import { acequire, edit, Editor, Position, Range } from 'brace';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';
import 'brace/theme/twilight';
import { fromEvent, merge, Observable, of, Subscription } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

const validWordCharacters: RegExp = /[\w'\-&]/;
const nonTraditionalWordCharacters: RegExp = /['\-&]/;

const editorInstance: Editor = edit('editor');
const footer: HTMLElement = document.getElementById('footer');

let footerTextUpdateSubscription: Subscription = Subscription.EMPTY;

setupEditor();
setupNewFile();
attachRhymeCompleter(editorInstance);
attachSyllableCountRenderer(editorInstance);

ipcRenderer.on('new-file', (_: any) => {
    if (!editorInstance.session.getUndoManager().isClean) {
        ipcRenderer.send('prompt-save-file-for-new');
    } else {
        setupNewFile();
    }
});

ipcRenderer.on('attempt-quit', (_: any) => {
    if (!editorInstance.session
        .getUndoManager()
        .isClean()) {
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
        editorInstance.session
            .getUndoManager()
            .markClean();

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
        editorInstance.setValue(data, -1);
        editorInstance.session
            .getUndoManager()
            .reset();
    }
});

ipcRenderer.on('undo', (_: any) => {
    undo();
});

ipcRenderer.on('redo', (_: any) => {
    redo();
});

ipcRenderer.on('find', (_: any) => {
    editorInstance.execCommand('find');
});

ipcRenderer.on('replace', (_: any) => {
    editorInstance.execCommand('replace');
});

function setupEditor(): void {
    // tslint:disable-next-line: no-unsafe-any
    const setCompleters: (completers: undefined[]) => void = acequire('ace/ext/language_tools').setCompleters;
    setCompleters([]);

    editorInstance.setTheme('ace/theme/twilight');
    editorInstance.setFontSize('14px');
    editorInstance.setBehavioursEnabled(false);
    editorInstance.setShowPrintMargin(false);
    editorInstance.setOptions({
        fontSize: '12pt'
    });
    editorInstance.session.setUseWrapMode(true);
    editorInstance.session.setMode('ace/mode/text');
    editorInstance.setOptions({
        enableLiveAutocompletion: true,
        enableBasicAutocompletion: false,
        enableSnippets: false
    });

    /*
    Redeclare the undo and redo methods to make them not select the text when undo/redo is done.
    */
    editorInstance.undo = (_?: boolean): Range => {
        return editorInstance.session
            .getUndoManager()
            .undo(true);
    };
    editorInstance.redo = (_?: boolean): void => {
        editorInstance.session
            .getUndoManager()
            .redo(true);
    };

    editorInstance.commands.addCommand({
        name: 'replace',
        bindKey: { win: 'Ctrl-R', mac: 'Cmd-R' },
        exec: (editor: Editor): void => {
            acequire('ace/config')
                .loadModule('ace/ext/searchbox', (e: any) => { e.Search(editor, true); });
        }
    });
}

function attachRhymeCompleter(editor: Editor): void {
    const util: IAutocompleteUtil = acequire('ace/autocomplete/util');

    const rhymeTable: HTMLTableElement = <HTMLTableElement>document.getElementById('rhyme-table');
    const rhymeCompleter: RhymeCompleter = new RhymeCompleter(rhymeTable);
    const cursorChanges: Observable<string> = fromEvent(editor.selection, 'changeCursor')
        .pipe(
            map(() => {
                const cursorPosition: Position = editor.getCursorPosition();

                return getWordUnderCursor(editorInstance, cursorPosition);
            })
        );
    const selectionChanges: Observable<string> = fromEvent(editor.selection, 'changeSelection')
        .pipe(
            map(() => {
                const selectionRange: Range = editor.selection.getRange();

                return trimNonTraditionalWordCharacters(editor.session.getTextRange(selectionRange));
            }),
            filter((value: string) => {
                return value.length > 0 &&
                    value
                        .charAt(0)
                        .match(/\w/) !== undefined;
            })
        );
    merge(selectionChanges, cursorChanges)
        .pipe(
            distinctUntilChanged(),
            tap(() => { rhymeCompleter.clearRhymes(); }),
            debounceTime(200),
            switchMap((value: string) => {
                let selectedWord: string = value;
                // tslint:disable-next-line:no-console
                console.log(selectedWord);
                if (value === undefined || value.length === 0) {
                    selectedWord = util.getCompletionPrefix(editor);
                }

                return rhymeCompleter.showRhymes(selectedWord, editor);
            })
        )
        .subscribe((): void => undefined);
}

function attachSyllableCountRenderer(editor: Editor): void {
    const syllableCountRenderer: SyllableCountRenderer = new SyllableCountRenderer();
    syllableCountRenderer.attach(editor);
}

function setupNewFile(): void {
    document.title = 'Untitled';
    editorInstance.setValue('');
    editorInstance.session
        .getUndoManager()
        .reset();
    ipcRenderer.send('new-file-created');
}

function alertError(error: NodeJS.ErrnoException): void {
    alert(`Failed to save file. \n\nError: ${error.message}`);
}

function undo(): void {
    editorInstance.undo();
}

function redo(): void {
    editorInstance.redo();
}

function getWordUnderCursor(editor: Editor, cursorPosition: Position): string {
    const line: string = editor.session.getLine(cursorPosition.row);
    let startIndex: number = cursorPosition.column;
    let endIndex: number = cursorPosition.column;
    let hasSeenWordCharacter: boolean = false;

    for (let i: number = cursorPosition.column; i >= 0; i -= 1) {
        const character: string = line.charAt(i);
        if (character.match(validWordCharacters)) {
            startIndex = i;
            hasSeenWordCharacter = true;
        } else if (hasSeenWordCharacter) {
            break;
        }
    }

    for (let i: number = startIndex; i < line.length; i += 1) {
        const character: string = line.charAt(i);
        if (!character.match(validWordCharacters)) {
            endIndex = i;
            break;
        }
    }

    return trimNonTraditionalWordCharacters(line.substring(startIndex, endIndex));
}

function trimNonTraditionalWordCharacters(value: string): string {
    let trimmedString: string = value;
    while (trimmedString
        .charAt(0)
        .match(nonTraditionalWordCharacters)) {
        trimmedString = trimmedString.substring(1);
    }

    while (trimmedString
        .charAt(trimmedString.length - 1)
        .match(nonTraditionalWordCharacters)) {
        trimmedString = trimmedString.substring(0, trimmedString.length - 1);
    }

    return trimmedString.trim();
}

interface IAutocompleteUtil {
    getCompletionPrefix(editor: Editor): string;
}
