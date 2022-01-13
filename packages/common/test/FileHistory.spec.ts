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
});
