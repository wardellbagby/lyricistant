var datamuse = require('datamuse')
var ace: AceAjax.Ace = require('ace-builds/src/ace')
import { Observable, from, empty, of } from "rxjs";
export class RhymeCompleter {
    table: HTMLTableElement

    constructor(table: HTMLTableElement) {
        this.table = table
    }

    showRhymes(prefix: String, editorInstance: AceAjax.Editor): Observable<void> {
        if (prefix.length === 0) {
            return of()
        }
        var cursorPositionAtStart = editorInstance.getCursorPosition()
        var beginIndex = { row: cursorPositionAtStart.row, column: cursorPositionAtStart.column - prefix.length }
        return from(Promise.all<Array<Rhyme>>([datamuse.words({ rel_rhy: prefix }), datamuse.words({ rel_nry: prefix })])
            .then((results) => {
                var rhymeList = results.flat().filter((rhyme, _index, _array) => {
                    return !rhyme.word.trim().includes(" ")
                })

                rhymeList.map((x: Rhyme) => {
                    var row = this.table.insertRow(-1)
                    var cell = row.insertCell()
                    cell.innerHTML = x.word
                    cell.classList.add("rhyme")
                    cell.onclick = (_) => {
                        var endColumn = beginIndex.column + prefix.length
                        editorInstance.focus()
                        editorInstance.session.replace(new ace.Range(beginIndex.row, beginIndex.column, beginIndex.row, endColumn), x.word)
                        editorInstance.moveCursorTo(beginIndex.row, beginIndex.column + x.word.length)
                    }
                })
            }));

    }

    clearRhymes() {
        this.table.innerHTML = ""
    }
}