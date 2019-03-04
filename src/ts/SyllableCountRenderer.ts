import { Editor, EditorChangeEvent, IEditSession } from 'brace';
import syllable from 'syllable';

export class SyllableCountRenderer {

    public getText(session: IEditSession, rowIndex: number): number {
        return syllable(session.getLine(rowIndex));
    }

    public getWidth(session: IEditSession, lastLineNumber: number, config: ILayerConfig): number {
        const lastRow: number = config.lastRow;

        return Math.max(
            lastLineNumber.toString().length,
            (lastRow + 1).toString().length,
            2
        ) * config.characterWidth;
    }

    public update(event: EditorChangeEvent, editor: Editor): void {
        const renderer: any = <any>editor.renderer;
        renderer.$loop.schedule(renderer.CHANGE_GUTTER);
    }

    public attach(editor: Editor): void {
        (<any>editor.renderer).$gutterLayer.$renderer = this;
        editor.on('changeSelection', <(e: any) => any>this.update);
        this.update(undefined, editor);
    }

    public detach(editor: Editor): void {
        const renderer: any = <any>editor.renderer;
        if (renderer.$gutterLayer.$renderer === this) {
            renderer.$gutterLayer.$renderer = undefined;
        }
        editor.off('changeSelection', this.update);
        this.update(undefined, editor);
    }
}

interface ILayerConfig {
    characterWidth: number;
    lastRow: number;
}
