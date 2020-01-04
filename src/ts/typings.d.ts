declare var monaco: typeof import("monaco-editor");

declare module 'datamuse' {
    export interface Params {
        rel_rhy?: string,
        rel_nry?: string,
        sl?: string
    }
    export interface Rhyme {
        word: string;
        score: number;
    }

    export function words(params: Params): Promise<Rhyme[]>
}

declare module 'syllable' {
    export default function syllable(word: string): number
}

declare module 'monaco-loader' {
    export default function monacoLoader(): Promise<typeof monaco>
}