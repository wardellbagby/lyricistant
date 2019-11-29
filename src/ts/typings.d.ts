declare module 'datamuse' {
    export interface Params {
        rel_rhy?: string,
        rel_nry?: string
    }
    export function words(params: Params): Promise<Rhyme[]>
}

declare module 'syllable' {
    export default function syllable(word: string): number
}