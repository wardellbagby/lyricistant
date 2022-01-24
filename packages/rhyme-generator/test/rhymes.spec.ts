import { readFileSync } from 'fs';
import path from 'path';
import { generateRhymes } from '@lyricistant/rhyme-generator/rhyme-generator';
import { expect } from 'chai';

const snapshot = JSON.parse(
  readFileSync(path.resolve(__dirname, 'snapshot.json'), 'utf8')
);

describe('Offline rhymes', () => {
  it('has a valid snapshot', () => {
    expect(Object.keys(snapshot)).to.not.be.empty;
  });

  Object.entries(snapshot).forEach(([word, expected]) => {
    it(`returns the right rhyme for ${word}`, () => {
      const actual = generateRhymes(word);

      expect(actual).to.not.be.empty;
      expect(expected).to.not.be.empty;
      expect(actual).to.eql(
        expected,
        `unexpected rhymes for ${word}. Do you need to update the snapshot? Update snapshot with ./tooling/update-rhymes-snapshot.ts`
      );
    });
  });
});
