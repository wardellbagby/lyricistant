import { readFileSync } from 'fs';
import path from 'path';
import { generateRhymes } from '@lyricistant/rhyme-generator/rhyme-generator';

const snapshot = JSON.parse(
  readFileSync(path.resolve(__dirname, 'snapshot.json'), 'utf8'),
);

describe('Offline rhymes', () => {
  it('has a valid snapshot', () => {
    expect(Object.keys(snapshot)).not.toBeEmpty();
  });

  Object.entries(snapshot).forEach(([word, expected]) => {
    it(`returns the right rhyme for ${word}`, () => {
      const actual = generateRhymes(word);

      expect(actual).not.toBeEmpty();
      expect(expected).not.toBeEmpty();
      try {
        expect(actual).toEqual(expected);
      } catch {
        throw new Error(
          `unexpected rhymes for ${word}. Do you need to update the snapshot? Update snapshot with ./tooling/update-rhymes-snapshot.ts`,
        );
      }
    });
  });
});
