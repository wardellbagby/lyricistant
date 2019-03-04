import { RhymeCompleter } from './RhymeCompleter';
import { SyllableCountRenderer } from './SyllableCountRenderer';

import { BrowserWindow, Menu, MenuItemConstructorOptions, remote } from 'electron';
import { readFile, writeFile } from 'fs';

import { acequire, edit, Editor, Range } from 'brace';
import 'brace/ext/language_tools';
import 'brace/theme/twilight';
import { fromEvent, merge, Observable } from 'rxjs';
import { debounceTime, map, mapTo, switchMap, tap } from 'rxjs/operators';

const currentWindow: BrowserWindow = remote.getCurrentWindow();
const editorInstance: Editor = edit('editor');

setMenu();
setupEditor();
attachRhymeCompleter(editorInstance);
attachSyllableCountRenderer(editorInstance);

function openHandler(): void {
    const fileNames: string[] = remote.dialog.showOpenDialog(currentWindow, { properties: ['openFile'] });

    if (fileNames !== undefined) {
        const fileName: string = fileNames[0];
        readFile(fileName, 'utf8', (err: Error, data: string) => {
            if (err !== undefined) {
                editorInstance.setValue(data);
                document.title = fileName;
                editorInstance.session.getUndoManager()
                    .reset();
            }
        });
    }
}

function saveHandler(): void {
    const fileName: string = remote.dialog.showSaveDialog(currentWindow, undefined, undefined);

    if (fileName !== undefined) {
        writeFile(fileName, editorInstance.getValue(), () => undefined);
        document.title = fileName;
    }
}

function setMenu(): void {
    const menuTemplate: MenuItemConstructorOptions[] = [{
        label: 'File',
        submenu: [{
            label: 'Open',
            click: openHandler,
            accelerator: 'CmdOrCtrl+O'
        }, {
            label: 'Save As',
            click: saveHandler,
            accelerator: 'Shift+CmdOrCtrl+S'
        }]
    }, {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'delete' },
            { role: 'selectall' }
        ]
    }, {
        role: 'window',
        submenu: [
            { role: 'minimize' }
        ]
    }];
    if (process.platform === 'darwin') {
        menuTemplate.unshift({
            label: remote.app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    const mainMenu: Menu = remote.Menu.buildFromTemplate(menuTemplate);

    remote.Menu.setApplicationMenu(mainMenu);
}

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
        .subscribe(() => undefined);
}

function attachSyllableCountRenderer(editor: Editor): void {
    const syllableCountRenderer: SyllableCountRenderer = new SyllableCountRenderer();
    syllableCountRenderer.attach(editor);
}

interface IAutocompleteUtil {
    getCompletionPrefix(editor: Editor): string;
}
