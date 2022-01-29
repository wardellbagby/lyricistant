import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { stubInterface } from 'ts-sinon';
import { FileHistory } from '@lyricistant/common/history/FileHistory';

use(sinonChai);

describe('File History', () => {
  let fileHistory: FileHistory;

  beforeEach(() => {
    sinon.reset();

    fileHistory = new FileHistory(stubInterface());
  });

  it('always keeps the history in sync with changes', async () => {
    const max = 10_000;
    const expected = `${max}`;

    for (let index = 0; index <= max; index++) {
      fileHistory.add(`${index}`);
    }

    fileHistory.deserialize(fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });

  it('always keeps the history in sync with round trips', async () => {
    const max = 100;
    const expected = `${max}`;

    for (let index = 0; index <= max; index++) {
      fileHistory.add(`${index}`);
      fileHistory.deserialize(fileHistory.serialize());
    }

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });

  it('works with more realistic changes', async () => {
    const expected = "It's all our world!\nThe old wondrous whirl.";

    fileHistory.add('Hello world!');
    fileHistory.add('Hello there world!');
    fileHistory.add('Hello there my world!');
    fileHistory.add('Hello there my world!\nOooh');
    fileHistory.add('Hello there my world!\nThe new shining pearl.');
    fileHistory.add("It's all your world!\nThe new shining pearl.");
    fileHistory.add("It's all your world!\nThe new wonderful whirl.");
    fileHistory.add('Actually, I like this lyric.');
    fileHistory.add(expected);

    fileHistory.deserialize(fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });

  it("doesn't save empty lyrics", async () => {
    const expected = 'Row your boat.';

    fileHistory.add('Row');
    fileHistory.add('Row your');
    fileHistory.add('Row your boat');
    fileHistory.add('');
    fileHistory.add('Row your boat!');
    fileHistory.add('');
    fileHistory.add(expected);
    fileHistory.add('');

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });

  it("doesn't save white-space only lyrics", async () => {
    const expected = '\n\n\tRow your boat.\n';

    fileHistory.add('Row');
    fileHistory.add('Row your');
    fileHistory.add('Row your boat');
    fileHistory.add('\n\n\n\n\n');
    fileHistory.add('Row your boat!');
    fileHistory.add('\n\n');
    fileHistory.add(expected);
    fileHistory.add('\t');

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });
});
