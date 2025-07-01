import { readFileSync } from 'fs';
import path from 'path';
import { FileMetadata } from '@lyricistant/common/files/PlatformFile';
import { Page } from 'playwright';

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
 * A Lyrics file that uses the V2 File History format.
 *
 * Contains at least two file history, with the second most recent change being
 * a change that changes it such that {@link DECENT_LYRICS} is no longer in the
 * file.
 */
export const DECENT_FILE_HISTORY: DroppableFile = {
  metadata: {
    path: 'decent-filehistory.lyrics',
  },
  data: readFileSync(path.resolve(resourcesDir, 'decent-filehistory.lyrics')),
};

export const DECENT_LYRICS = "Maybe I'm still grieving.";

export const getEditor = (screen: Page) => screen.getByRole('textbox');

export const findMenuButton = async (page: Page, name: string) => {
  const overflowButton = page.getByRole('button', {
    name: 'Additional Menu Buttons',
  });
  const possibleMenuBarButton = page.getByRole('button', {
    name,
  });

  if (await possibleMenuBarButton.isVisible()) {
    return possibleMenuBarButton;
  }

  if (!(await overflowButton.isVisible())) {
    throw new Error(
      `Failed to find menu button "${name}" and overflow button isn't visible.`,
    );
  }

  // Assume its hiding in the overflow menu.
  await overflowButton.click();

  return page.getByRole('menuitem', {
    name,
  });
};

export const dropFile = async (page: Page, droppableFile: DroppableFile) => {
  const editor = getEditor(page);

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
    [droppableFile.metadata, data],
  );

  await editor.dispatchEvent('drop', { dataTransfer });
  const loadingOverlay = page.getByRole('presentation');
  await loadingOverlay.waitFor({ state: 'attached' });
  await loadingOverlay.waitFor({ state: 'detached' });
};
