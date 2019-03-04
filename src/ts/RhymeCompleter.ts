import { Editor, Position, Range } from 'brace';
import { words } from 'datamuse';
import { from as rxFrom, Observable, of } from 'rxjs';
export class RhymeCompleter {
    private readonly table: HTMLTableElement;

    constructor(table: HTMLTableElement) {
        this.table = table;
    }

    public showRhymes(prefix: String, editorInstance: Editor): Observable<void> {
        if (prefix.length === 0) {
            return of();
        }
        const cursorPositionAtStart: Position = editorInstance.getCursorPosition();
        const beginIndex: Position = { row: cursorPositionAtStart.row, column: cursorPositionAtStart.column - prefix.length };

        return rxFrom(
            Promise.all<Rhyme[]>([words({ rel_rhy: prefix }), words({ rel_nry: prefix })])
                .then((results: Rhyme[][]) => {
                    const rhymeList: Rhyme[] = results.flat()
                        .filter((rhyme: Rhyme) => {
                            return !rhyme.word.trim()
                                .includes(' ');
                        });

                    rhymeList.forEach((x: Rhyme) => {
                        const row: HTMLTableRowElement = this.table.insertRow(-1);
                        const cell: HTMLTableCellElement = row.insertCell();
                        cell.appendChild(document.createTextNode(x.word));
                        cell.classList.add('rhyme');
                        cell.onclick = (): void => {
                            const endColumn: number = beginIndex.column + prefix.length;
                            editorInstance.focus();
                            editorInstance.session.replace(new Range(beginIndex.row, beginIndex.column, beginIndex.row, endColumn), x.word);
                            editorInstance.moveCursorTo(beginIndex.row, beginIndex.column + x.word.length);
                        };
                    });
                }));

    }

    public clearRhymes(): void {
        while (this.table.hasChildNodes()) {
            this.table.removeChild(this.table.lastChild);
        }
    }
}
