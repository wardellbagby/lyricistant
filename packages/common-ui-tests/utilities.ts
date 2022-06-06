import { readFileSync } from 'fs';
import path from 'path';
import { FileMetadata } from '@lyricistant/common/files/PlatformFile';
import { Page } from 'playwright';
import { PlaywrightScreen } from './index';

interface DroppableFile {
  metadata: FileMetadata;
  data: string | ArrayBuffer;
}
const resourcesDir = path.resolve(__dirname, 'resources');

export const HELLO_WORLD_PLAIN_TEXT_FILE: DroppableFile = {
  metadata: {
    path: 'helloworld.txt',
  },
  data: 'Hello World!',
};

export const HELLO_WORLD_LYRICS_V1_FILE: DroppableFile = {
  metadata: {
    path: 'helloworld.lyrics',
  },
  data: readFileSync(path.resolve(resourcesDir, 'helloworld.lyrics')).buffer,
};

export const getEditor = async (screen: PlaywrightScreen) =>
  await screen.findByRole('textbox');

export const queryMenuButton = async (
  screen: PlaywrightScreen,
  name: string
) => {
  const button = await screen.queryByRole('button', {
    name,
  });

  if (button) {
    return button;
  } else {
    // Assume its hiding in the overflow menu.
    const overflowButton = await screen.queryByRole('button', {
      name: 'Additional Menu Buttons',
    });
    await overflowButton?.click();

    return await screen.queryByRole('menuitem', {
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
};
