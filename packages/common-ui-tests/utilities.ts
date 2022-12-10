import { readFileSync } from 'fs';
import path from 'path';
import { FileMetadata } from '@lyricistant/common/files/PlatformFile';
import { Page } from 'playwright';
import { PlaywrightScreen } from './index';

interface DroppableFile {
  metadata: FileMetadata;
  data: string | ArrayBuffer;
}
export const resourcesDir = path.resolve(__dirname, 'resources');

/** A plain text file with the text "Hello World!" */
export const HELLO_WORLD_PLAIN_TEXT_FILE: DroppableFile = {
  metadata: {
    path: 'helloworld.txt',
  },
  data: 'Hello World!',
};

/** A Lyrics file with the text "Hello World!" */
export const HELLO_WORLD_LYRICS_V1_FILE: DroppableFile = {
  metadata: {
    path: 'helloworld.lyrics',
  },
  data: readFileSync(path.resolve(resourcesDir, 'helloworld.lyrics')),
};

/**
 * A Lyrics file that uses the legacy V1 File History format.
 *
 * Contains at least two file history, with the second most recent change being
 * a change that changes the first line to match
 * {@link BURY_ME_LOOSE_PRE_LYRICS}, but otherwise will match {@link BURY_ME_LOOSE_LYRICS}
 */
export const BURY_ME_LOOSE_V1_FILE_HISTORY: DroppableFile = {
  metadata: {
    path: 'burymeloose-v1filehistory.lyrics',
  },
  data: readFileSync(
    path.resolve(resourcesDir, 'burymeloose-v1filehistory.lyrics')
  ),
};
/**
 * A Lyrics file that uses the V2 File History format.
 *
 * Contains at least two file history, with the second most recent change being
 * a change that changes the first line to match
 * {@link BURY_ME_LOOSE_PRE_LYRICS}, but otherwise will match {@link BURY_ME_LOOSE_LYRICS}
 */
export const BURY_ME_LOOSE_V2_FILE_HISTORY: DroppableFile = {
  metadata: {
    path: 'burymeloose-v2filehistory.lyrics',
  },
  data: readFileSync(
    path.resolve(resourcesDir, 'burymeloose-v2filehistory.lyrics')
  ),
};

export const BURY_ME_LOOSE_LYRICS = "Tell 'em bury me loose";
export const BURY_ME_LOOSE_PRE_LYRICS = 'Bury me loose';

export const getEditor = async (screen: PlaywrightScreen) =>
  await screen.findByRole('textbox');

export const findMenuButton = async (
  screen: PlaywrightScreen,
  name: string,
  isSmallLayout: boolean
) => {
  if (isSmallLayout) {
    // Assume its hiding in the overflow menu.
    const overflowButton = await screen.findByRole('button', {
      name: 'Additional Menu Buttons',
    });
    await overflowButton.click();

    return screen.findByRole('menuitem', {
      name,
    });
  } else {
    return screen.findByRole('button', {
      name,
    });
  }
};

export const dropFile = async (
  page: Page,
  screen: PlaywrightScreen,
  droppableFile: DroppableFile
) => {
  const editor = await getEditor(screen);

  let data: string | number[];

  if (typeof droppableFile.data === 'string') {
    data = droppableFile.data;
  } else {
    data = [...new Uint8Array(droppableFile.data)];
  }

  const dataTransfer = await page.evaluateHandle(
    ([meta, fileData]: [FileMetadata, string | number[]]) => {
      const dt = new DataTransfer();

      let fileBit: BlobPart;
      if (typeof fileData === 'string') {
        fileBit = fileData;
      } else {
        fileBit = new Uint8Array(fileData);
      }

      const file = new File([fileBit], meta.name ?? meta.path);
      dt.items.add(file);
      return dt;
    },
    [droppableFile.metadata, data]
  );

  await editor.dispatchEvent('drop', { dataTransfer });
  await (await screen.findByText('Opening file')).waitForElementState('hidden');
};
