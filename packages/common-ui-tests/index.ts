import { Page } from 'playwright';
import {
  DECENT_LYRICS,
  DECENT_FILE_HISTORY,
  dropFile,
  getEditor,
  HELLO_WORLD_LYRICS_V1_FILE,
  HELLO_WORLD_PLAIN_TEXT_FILE,
  findMenuButton,
} from './utilities';

export * from './utilities';
export * from './responses';

export default (
  getDependencies: () => Promise<{
    page: Page;
  }>,
) => {
  it('shows a prompt when creating a new file with changes', async () => {
    const { page } = await getDependencies();
    const text = 'The Soul';

    const editor = getEditor(page);

    await editor.click();
    await editor.type(text, { delay: 10 });

    await expect(editor.textContent()).resolves.toEqual(text);

    const newFileButton = page.getByRole('button', {
      name: 'New file',
    });
    await newFileButton.click();

    await expect(
      page.getByText('Discard unsaved changes?').isVisible(),
    ).resolves.toBeTruthy();
  });

  it('does not show a prompt when creating a new file after loading a plain text file', async () => {
    const { page } = await getDependencies();

    await dropFile(page, HELLO_WORLD_PLAIN_TEXT_FILE);

    await expect(
      page.getByText('Hello World!').isVisible(),
    ).resolves.toBeTruthy();

    const newFileButton = page.getByRole('button', {
      name: 'New file',
    });
    await newFileButton.click();

    await expect(
      page.getByText('Discard unsaved changes?').isVisible(),
    ).resolves.toBeFalsy();
  });

  it('does not show a prompt when creating a new file after loading a lyrics file', async () => {
    const { page } = await getDependencies();

    await dropFile(page, HELLO_WORLD_LYRICS_V1_FILE);

    await expect(
      page.getByText('Hello World!').isVisible(),
    ).resolves.toBeTruthy();

    const newFileButton = page.getByRole('button', {
      name: 'New file',
    });
    await newFileButton.click();

    await expect(
      page.getByText('Discard unsaved changes?').isVisible(),
    ).resolves.toBeFalsy();
  });

  it('shows preferences', async () => {
    const { page } = await getDependencies();

    const settings = await findMenuButton(page, 'Open preferences');
    await settings.click();

    const preferencesHeader = page.getByRole('heading', {
      name: 'Preferences',
    });
    const aboutButton = page.getByText('About');

    await expect(preferencesHeader.isVisible()).resolves.toBeTruthy();
    await expect(aboutButton.isVisible()).resolves.toBeTruthy();

    const save = page.getByRole('button', { name: 'Save' });
    await save.click();

    await preferencesHeader.waitFor({ state: 'hidden' });
    await expect(preferencesHeader.isVisible()).resolves.toBeFalsy();
    await expect(aboutButton.isVisible()).resolves.toBeFalsy();
  });

  it('loads v2 file history', async () => {
    const { page } = await getDependencies();
    const firstLineChangeLabel = 'Jun 29, 2025, 7:52:03 PM';

    await dropFile(page, DECENT_FILE_HISTORY);

    await expect(
      page.getByText(DECENT_LYRICS).isVisible(),
    ).resolves.toBeTruthy();

    const fileHistory = await findMenuButton(page, 'View file history');
    await fileHistory.click();

    await expect(
      page.getByRole('heading', { name: 'File history' }).isVisible(),
    ).resolves.toBeTruthy();

    const firstLineChangeFileHistory = page.getByText(firstLineChangeLabel);

    await firstLineChangeFileHistory.click();
    await page.getByText('Apply').click();

    await expect(
      page.getByText(DECENT_LYRICS).isHidden(),
    ).resolves.toBeTruthy();
  });
};
