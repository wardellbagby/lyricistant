import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'ts-sinon';
import { FileHistory } from '@lyricistant/common/history/FileHistory';

use(sinonChai);

describe('File History', () => {
  let fileHistory: FileHistory;

  beforeEach(() => {
    sinon.reset();

    fileHistory = new FileHistory();
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
});
