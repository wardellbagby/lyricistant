import expect from 'expect';
import { FileHistory } from '@lyricistant/common-platform/history/FileHistory';
import { FakeClock } from '@lyricistant/common-platform/time/Clock';
import { mockDeep } from 'jest-mock-extended';

const V1_FILE_HISTORY = {
  version: 1,
  data: '[{"patches":[{"diffs":[[1,"Bury me loose\\n"]],"start1":0,"start2":0,"length1":0,"length2":14}],"time":"2022-07-20T17:28:08.324-07:00"},{"patches":[{"diffs":[[0,"e loose\\n"],[1,"I ain\'t ever been about the views."]],"start1":6,"start2":6,"length1":8,"length2":42}],"time":"2022-07-20T17:28:29.355-07:00"},{"patches":[{"diffs":[[0,"e views."],[1,"\\nTell \'em bury me loose."]],"start1":40,"start2":40,"length1":8,"length2":32}],"time":"2022-07-20T17:28:38.181-07:00"},{"patches":[{"diffs":[[0,"e loose."],[1,"\\nAnd don\'t let \'em give you no exc"]],"start1":64,"start2":64,"length1":8,"length2":42}],"time":"2022-07-20T17:28:46.018-07:00"},{"patches":[{"diffs":[[0,"u no exc"],[1,"use."]],"start1":98,"start2":98,"length1":8,"length2":12}],"time":"2022-07-20T17:28:49.380-07:00"},{"patches":[{"diffs":[[-1,"B"],[1,"Tell \'em b"],[0,"ury "]],"start1":0,"start2":0,"length1":5,"length2":14}],"time":"2022-07-20T17:29:12.099-07:00"}]',
};
const V1_PARSED_HISTORY =
  "Tell 'em bury me loose\n" +
  "I ain't ever been about the views.\n" +
  "Tell 'em bury me loose.\n" +
  "And don't let 'em give you no excuse.";
describe('File History', () => {
  let fileHistory: FileHistory;

  beforeEach(() => {
    fileHistory = new FileHistory(new FakeClock(), mockDeep());
  });

  it('always keeps the history in sync with additions', async () => {
    const max = 10_000;
    const expected = `${max}`;

    for (let index = 0; index <= max; index++) {
      fileHistory.add(`${index}`);
    }

    await fileHistory.deserialize(await fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).toEqual(expected);
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

    expect(fileHistory.getParsedHistory()).toEqual(expected);
  });

  it('always keeps the history in sync with round trips', async () => {
    const max = 100;
    const expected = `${max}`;

    for (let index = 0; index <= max; index++) {
      fileHistory.add(`${index}`);
      await fileHistory.deserialize(await fileHistory.serialize());
    }

    expect(fileHistory.getParsedHistory()).toEqual(expected);
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

    expect(fileHistory.getParsedHistory()).toEqual(expected);
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

    expect(fileHistory.getParsedHistory()).toEqual(expected);
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

    expect(fileHistory.getParsedHistory()).toEqual(expected);
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

    expect(fileHistory.getParsedHistory()).toEqual(expected);
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

    expect(fileHistory.getParsedHistory()).toEqual(expected);
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

    expect(fileHistory.getParsedHistory()).toEqual(expected);
  });

  it('properly converts v1 file history to v2', async () => {
    await fileHistory.deserialize(V1_FILE_HISTORY);

    expect(fileHistory.getParsedHistory()).toEqual(V1_PARSED_HISTORY);

    await fileHistory.deserialize(await fileHistory.serialize());

    expect(fileHistory.getParsedHistory()).toEqual(V1_PARSED_HISTORY);
  });
});
