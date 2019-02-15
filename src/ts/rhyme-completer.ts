var datamuse = require('datamuse')
import { Observable, from, empty, of } from "rxjs";
export class RhymeCompleter {
    table: HTMLTableElement

    constructor(table: HTMLTableElement) {
        this.table = table
    }

    showRhymes(prefix: String, editorInstance: AceAjax.Editor): Observable<void> {
        if (prefix.length === 0) {
            return of() //todo is there not a "complete" that'll complete the Observable immediately?
        }
        return from(Promise.all<Array<Rhyme>>([datamuse.words({ rel_rhy: prefix }), datamuse.words({ rel_nry: prefix })])
            .then((results) => {
                var rhymeList = results.flat().filter((rhyme, index, array) => {
                    return !rhyme.word.trim().includes(" ")
                })

                this.table.innerHTML = ""
                rhymeList.map((x: Rhyme) => {
                    var row = this.table.insertRow(-1)
                    var cell = row.insertCell()
                    cell.innerHTML = x.word
                    cell.classList.add("rhyme")
                    var cursorPositionAtStart = editorInstance.getCursorPosition()
                    var beginIndex = { row: cursorPositionAtStart.row, column: cursorPositionAtStart.column - prefix.length }
                    cell.onclick = (_) => {
                        var endIndex = editorInstance.getCursorPosition();
                        editorInstance.focus()
                        editorInstance.session.replace(new ace.Range(beginIndex.row, beginIndex.column, endIndex.row, endIndex.column), x.word)
                    }
                })
            }));

    }
}