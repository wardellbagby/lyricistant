import { RhymeCompleter } from "./rhyme-completer";
import { SyllableCountRenderer } from "./syllable-count-renderer";

import { MenuItemConstructorOptions } from "electron";
var remote = require('electron').remote;
var Menu = remote.Menu;
var fs = require('fs');

var ace = require('ace-builds/src/ace');
var twilightTheme = require('ace-builds/src/theme-twilight');
import { fromEvent } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

var currentWindow = remote.getCurrentWindow();
var editorInstance: AceAjax.Editor = ace.edit('editor');

setMenu()
setupEditor()
attachRhymeCompleter(editorInstance)
attachSyllableCountRenderer(editorInstance)

function openHandler() {
    var fileNames = remote.dialog.showOpenDialog(currentWindow, { properties: ['openFile'] });

    if (fileNames !== undefined) {
        var fileName = fileNames[0];
        fs.readFile(fileName, 'utf8', function (err: Error, data: string) {
            if (!err) {
                editorInstance.setValue(data);
                document.title = fileName
                editorInstance.session.getUndoManager().reset()
            }
        });
    }
}

function saveHandler() {
    var fileName = remote.dialog.showSaveDialog(currentWindow, null, null);

    if (fileName !== undefined) {
        fs.writeFile(fileName, editorInstance.getValue());
        document.title = fileName
    }
}

function setMenu() {
    var menuTemplate: MenuItemConstructorOptions[] = [{
        label: 'File',
        submenu: [{
            label: 'Open',
            click: openHandler
        }, {
            label: 'Save As',
            click: saveHandler
        }],
    }]
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
        })
    }
    var mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);
}

function setupEditor() {
    var langTools = require('ace-builds/src/ext-language_tools');
    langTools.setCompleters([])

    editorInstance.setTheme(twilightTheme);
    editorInstance.setFontSize("14px")
    editorInstance.setBehavioursEnabled(false)
    editorInstance.setOptions({
        fontSize: "12pt"
    });
    editorInstance.session.setUseWrapMode(true)
    editorInstance.setOptions({
        enableLiveAutocompletion: true,
        enableBasicAutocompletion: false,
        enableSnippets: false
    });

}

function attachRhymeCompleter(editorInstance: AceAjax.Editor) {
    var util = ace.require("ace/autocomplete/util")
    var rhymeCompleter = new RhymeCompleter(document.getElementById("rhyme_table") as HTMLTableElement)
    fromEvent(editorInstance.selection, "changeCursor").pipe(
        debounceTime(200),
        switchMap((_value, _index) => {
            var prefix = util.getCompletionPrefix(editorInstance);
            return rhymeCompleter.showRhymes(prefix, editorInstance)
        })
    )
        .subscribe((_event: any) => { })
}

function attachSyllableCountRenderer(editorInstance: AceAjax.Editor) {
    var syllableCountRenderer = new SyllableCountRenderer()
    syllableCountRenderer.attach(editorInstance)
}

