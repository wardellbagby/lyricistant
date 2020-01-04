import { Rhyme as ApiRhyme } from 'datamuse';

export class Rhyme implements ApiRhyme {
    public word: string;
    public score: number;
    constructor(word: string, score: number) {
        this.word = word;
        this.score = score;
    }
}
