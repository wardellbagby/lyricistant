var syllable = require('syllable')

export class SyllableCountRenderer {

    constructor() { }

    getText(session: AceAjax.IEditSession, rowIndex: number) {
        return syllable(session.getLine(rowIndex));
    }

    getWidth(_session: AceAjax.IEditSession, lastLineNumber: number, config: any) {
        return Math.max(
            lastLineNumber.toString().length,
            (config.lastRow + 1).toString().length,
            2
        ) * config.characterWidth;
    }

    update(_event: any, editor: AceAjax.Editor) {
        editor.renderer.$loop.schedule(editor.renderer.CHANGE_GUTTER);
    }

    attach(editor: AceAjax.Editor) {
        editor.renderer.$gutterLayer.$renderer = this;
        editor.on("changeSelection", this.update as any); //Trust me, this works.
        this.update(null, editor);
    }

    detach(editor: AceAjax.Editor) {
        if (editor.renderer.$gutterLayer.$renderer == this)
            editor.renderer.$gutterLayer.$renderer = null;
        editor.off("changeSelection", this.update);
        this.update(null, editor);
    }
}