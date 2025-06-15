import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { FakeClock } from '@lyricistant/common-platform/time/Clock';
import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { stubInterface } from 'ts-sinon';

use(sinonChai);

describe('File History', () => {
  let fileHistory: FileHistory;

  beforeEach(() => {
    sinon.reset();

    fileHistory = new FileHistory(new FakeClock(), stubInterface());
  });

  it('always keeps the history in sync with additions', async () => {
    const max = 10_000;
    const expected = `${max}`;

    for (let index = 0; index <= max; index++) {
      fileHistory.add(`${index}`);
    }

    await fileHistory.deserialize(await fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });

  it('always keeps the history in sync with changes', async () => {
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    const expected = alpha.split('').join('\n');

    for (let index = 0; index < 1_014; index++) {
      const lyrics = alpha
        .slice(0, (index % alpha.length) + 1)
        .split('')
        .join('\n');

      fileHistory.add(lyrics);
    }

    await fileHistory.deserialize(await fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });

  it('always keeps the history in sync with round trips', async () => {
    const max = 100;
    const expected = `${max}`;

    for (let index = 0; index <= max; index++) {
      fileHistory.add(`${index}`);
      await fileHistory.deserialize(await fileHistory.serialize());
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

    await fileHistory.deserialize(await fileHistory.serialize());

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

  it('handles complete removals correctly', async () => {
    const expected = "I'm brand new...";

    fileHistory.add("It's your guy!");
    fileHistory.add("It's your guy\nMr. Doctor.");
    fileHistory.add("It's your guy\n\nMr. Doctor.");
    fileHistory.add("It's your guy\nIt's your man!\nMr. Doctor.");
    fileHistory.add("It's your guy\nIt's your man!\nMr. Doctor. Professor!");
    fileHistory.add(expected);

    await fileHistory.deserialize(await fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });

  it('handles line removals correctly removals.', async () => {
    const expected = "It's your boy!\n\nMr. Doctor. Professor!";

    fileHistory.add("It's your boy!");
    fileHistory.add("It's your boy\nMr. Doctor.");
    fileHistory.add("It's your boy\n\nMr. Doctor.");
    fileHistory.add(
      "It's your boy\n\nIt's your guy!\nIt's your man!\nMr. Doctor.",
    );
    fileHistory.add(
      "It's your boy\n\nIt's your guy!\nIt's your man!\nMr. Doctor. Professor!",
    );
    fileHistory.add(expected);

    await fileHistory.deserialize(await fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });

  it('handles modifications correctly', async () => {
    const expected =
      'The MC\nThe Soup\nThe Breeze (Cool)\nThe Friends N Strangers';

    fileHistory.add('The MC');
    fileHistory.add('The MC\nThe Soup');
    fileHistory.add('The MC\nThe Soup\nThe Breeze');
    fileHistory.add('The MC\nThe Soup\nThe Breeze\nThe Friends N Strangers');
    fileHistory.add(expected);

    await fileHistory.deserialize(await fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).to.equal(expected);
  });
});
