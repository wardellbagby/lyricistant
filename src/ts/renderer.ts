import { RhymeCompleter } from './RhymeCompleter';
import { SyllableCountRenderer } from './SyllableCountRenderer';

import { ipcRenderer } from 'electron';

import { acequire, edit, Editor, Range } from 'brace';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';
import 'brace/theme/twilight';
import { fromEvent, merge, Observable, of, Subscription } from 'rxjs';
import { debounceTime, delay, map, mapTo, switchMap, tap } from 'rxjs/operators';

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
    const cursorChanges: Observable<{}> = fromEvent(editor.selection, 'changeCursor')
        .pipe(mapTo(undefined));
    const selectionChanges: Observable<{}> = fromEvent(editor.selection, 'changeSelection')
        .pipe(map(() => {
            const selectionRange: Range = editor.selection.getRange();

            return editor.session.getTextRange(selectionRange);
        }));
    merge(cursorChanges, selectionChanges)
        .pipe(
            tap(() => { rhymeCompleter.clearRhymes(); }),
            debounceTime(200),
            switchMap((value: string | undefined) => {
                let prefix: string = value;
                if (value === undefined || value.length === 0) {
                    prefix = util.getCompletionPrefix(editor);
                }

                return rhymeCompleter.showRhymes(prefix, editor);
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

interface IAutocompleteUtil {
    getCompletionPrefix(editor: Editor): string;
}
